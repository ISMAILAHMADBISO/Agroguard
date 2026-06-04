/**
 * AgroGuard ESP32 Firmware — 7-in-1 Soil Sensor + DHT22
 * =========================================================
 * Compatible hardware:
 *   - ESP32 Dev Board (any variant)
 *   - 7-in-1 RS485 Soil Sensor (Modbus RTU)
 *       Channels: Moisture · Temperature · EC · pH · N · P · K
 *   - DHT22 (AM2302) — ambient temperature & humidity
 *
 * Wiring:
 *   DHT22  DATA  → GPIO 4
 *   RS485  DE/RE → GPIO 5   (MAX485 driver enable)
 *   RS485  DI    → GPIO 17  (ESP32 TX2)
 *   RS485  RO    → GPIO 16  (ESP32 RX2)
 *   RS485  A/B   → sensor A/B terminals
 *
 * Setup:
 *   1. Flash this sketch onto your ESP32.
 *   2. Set DEVICE_ID to match the hardware ID registered in the platform
 *      (copy the AGR-XXXX-XXXX code from the device registration modal).
 *   3. Configure your Wi-Fi SSID/password below.
 *   4. Set API_HOST to your AgroGuard platform domain.
 *
 * Data flow:
 *   ESP32 reads sensors every READING_INTERVAL_MS, then POSTs JSON to
 *   POST /api/readings. The platform resolves DEVICE_ID → internal DB id.
 *
 * Dependencies (install via Arduino Library Manager):
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *   - ArduinoJson (v6+)
 *   - ModbusMaster by 4-20mA
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

// ── USER CONFIGURATION ────────────────────────────────────────────────────────

/** Wi-Fi credentials */
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

/**
 * AgroGuard hardware device ID.
 * Must match exactly the Device ID registered in the platform (Devices page).
 * Copy it from the device detail page or registration modal — e.g. "AGR-K8NP-X3QW"
 */
const char* DEVICE_ID = "AGR-XXXX-XXXX";

/**
 * AgroGuard platform API base URL.
 * Production:  "https://your-app.vercel.app"  (or your custom domain)
 * Local dev:   "http://192.168.1.100:8080"   (your PC's LAN IP + API port)
 */
const char* API_HOST = "https://your-app.vercel.app";

/** Reading interval in milliseconds (default: 60 seconds) */
const unsigned long READING_INTERVAL_MS = 60000UL;

// ── PIN ASSIGNMENTS ───────────────────────────────────────────────────────────

#define DHT_PIN   4      // DHT22 data pin
#define DHT_TYPE  DHT22
#define RS485_DE  5      // MAX485 driver enable (HIGH=TX, LOW=RX)
#define RS485_RX  16     // ESP32 RX2 ← RS485 RO
#define RS485_TX  17     // ESP32 TX2 → RS485 DI

// ── MODBUS REGISTER MAP (7-in-1 soil sensor, slave 0x01) ────────────────────
#define MODBUS_SLAVE_ID  0x01
#define REG_MOISTURE     0x0000  // raw ÷10 → % (0–1000 → 0–100%)
#define REG_TEMPERATURE  0x0001  // raw ÷10 → °C (values >400 are negative offset)
#define REG_EC           0x0002  // raw mS/m (no scaling needed)
#define REG_PH           0x0003  // raw ÷10 → pH (0–140 → 0–14)
#define REG_NITROGEN     0x0004  // raw mg/kg
#define REG_PHOSPHORUS   0x0005  // raw mg/kg
#define REG_POTASSIUM    0x0006  // raw mg/kg
#define NUM_REGISTERS    7

// ── HARDWARE OBJECTS ──────────────────────────────────────────────────────────

DHT          dht(DHT_PIN, DHT_TYPE);
ModbusMaster modbus;

// MAX485 direction control callbacks
void preTransmission()  { digitalWrite(RS485_DE, HIGH); }
void postTransmission() { digitalWrite(RS485_DE, LOW);  }

// ── DATA STRUCT ───────────────────────────────────────────────────────────────

struct SensorData {
  // Core
  float soilMoisture;     // %
  float temperature;      // °C (ambient from DHT22)
  float humidity;         // %
  float heatIndex;        // °C

  // 7-in-1 extra channels
  float soilTemperature;  // °C (from RS485 sensor itself)
  float ec;               // mS/m
  float ph;               // 0–14
  float nitrogen;         // mg/kg
  float phosphorus;       // mg/kg
  float potassium;        // mg/kg

  bool soilOk;            // Modbus read succeeded
  bool dhtOk;             // DHT22 read succeeded
};

// ── SENSOR READS ──────────────────────────────────────────────────────────────

bool readSoilSensor(SensorData& d) {
  uint8_t result = modbus.readHoldingRegisters(REG_MOISTURE, NUM_REGISTERS);
  if (result != modbus.ku8MBSuccess) {
    Serial.printf("[MODBUS] Error 0x%02X — check RS485 wiring and slave ID\n", result);
    return false;
  }

  d.soilMoisture   = modbus.getResponseBuffer(0) / 10.0f;
  uint16_t rawTemp = modbus.getResponseBuffer(1);
  // Sensors encode negative temps as (value + 400), e.g. -5°C = 395
  d.soilTemperature = (rawTemp > 400) ? (rawTemp - 400) / 10.0f - 40.0f : rawTemp / 10.0f;
  d.ec             = (float)modbus.getResponseBuffer(2);
  d.ph             = modbus.getResponseBuffer(3) / 10.0f;
  d.nitrogen       = (float)modbus.getResponseBuffer(4);
  d.phosphorus     = (float)modbus.getResponseBuffer(5);
  d.potassium      = (float)modbus.getResponseBuffer(6);
  return true;
}

bool readDHT22(SensorData& d) {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("[DHT22] Read failed — check data pin wiring");
    return false;
  }
  d.humidity  = h;
  d.temperature = t;
  d.heatIndex = dht.computeHeatIndex(t, h, false);
  return true;
}

// ── HTTP POST ─────────────────────────────────────────────────────────────────

bool postReading(const SensorData& d) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Not connected — skipping POST");
    return false;
  }

  HTTPClient http;
  String url = String(API_HOST) + "/api/readings";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<512> doc;
  doc["deviceId"]   = DEVICE_ID;
  doc["soilMoisture"] = d.soilOk ? d.soilMoisture : 0.0f;
  doc["temperature"]  = d.dhtOk  ? d.temperature  : d.soilTemperature;
  doc["humidity"]     = d.dhtOk  ? d.humidity      : 0.0f;
  doc["heatIndex"]    = d.dhtOk  ? d.heatIndex     : d.soilTemperature;

  // 7-in-1 extra fields (only sent when Modbus read succeeded)
  if (d.soilOk) {
    doc["soilMoisture"]           = d.soilMoisture;   // override with real value
    doc["electricalConductivity"] = d.ec;
    doc["ph"]                     = d.ph;
    doc["nitrogen"]               = d.nitrogen;
    doc["phosphorus"]             = d.phosphorus;
    doc["potassium"]              = d.potassium;
  }

  String payload;
  serializeJson(doc, payload);

  Serial.println("[HTTP] POST " + url);
  Serial.println("[HTTP] " + payload);

  int code = http.POST(payload);
  Serial.printf("[HTTP] Status: %d\n", code);
  if (code != 201) {
    Serial.println("[HTTP] Response: " + http.getString());
  }
  http.end();
  return (code == 201);
}

// ── WI-FI ─────────────────────────────────────────────────────────────────────

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 20000UL) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Connection failed — will retry");
  }
}

// ── SETUP ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== AgroGuard Node ===");
  Serial.println("Device: " + String(DEVICE_ID));

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  dht.begin();

  // Serial2 for RS485 Modbus
  Serial2.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  modbus.begin(MODBUS_SLAVE_ID, Serial2);
  modbus.preTransmission(preTransmission);
  modbus.postTransmission(postTransmission);

  connectWiFi();
  Serial.println("[SETUP] Ready. First reading in 5 s...");
  delay(5000);
}

// ── LOOP ──────────────────────────────────────────────────────────────────────

unsigned long lastReading = 0;

void loop() {
  connectWiFi(); // ensure connected

  unsigned long now = millis();
  if (now - lastReading >= READING_INTERVAL_MS || lastReading == 0) {
    lastReading = now;

    SensorData data = {};

    data.soilOk = readSoilSensor(data);
    if (data.soilOk) {
      Serial.printf("[SOIL] M=%.1f%% T=%.1f°C EC=%.0f pH=%.1f N=%.0f P=%.0f K=%.0f\n",
        data.soilMoisture, data.soilTemperature,
        data.ec, data.ph, data.nitrogen, data.phosphorus, data.potassium);
    }

    delay(200); // stability gap between sensor reads
    data.dhtOk = readDHT22(data);
    if (data.dhtOk) {
      Serial.printf("[DHT22] T=%.1f°C H=%.1f%% HI=%.1f°C\n",
        data.temperature, data.humidity, data.heatIndex);
    }

    if (!data.soilOk && !data.dhtOk) {
      Serial.println("[ERROR] All sensors failed — check wiring and power");
      return;
    }

    bool ok = postReading(data);
    Serial.println(ok ? "[OK] Submitted." : "[FAIL] Will retry next cycle.");
  }

  delay(1000);
}
