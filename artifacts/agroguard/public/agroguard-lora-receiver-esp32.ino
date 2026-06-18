/**
 * AgroGuard LoRa Receiver / Gateway (ESP32)
 * =========================================
 * Receives 7-in-1 soil readings over LoRa from the transmitter field node,
 * shows them on an OLED display, and forwards every reading to the AgroGuard
 * platform over WiFi via POST /api/readings.
 *
 * Compatible hardware:
 *   - ESP32 Dev Board
 *   - SX1278 / RA-02 LoRa module (433MHz)
 *   - SH1106 1.3" I2C OLED
 *
 * Wiring:
 *   LoRa (SPI):  NSS -> 18, RST -> 14, DIO0 -> 26, SCK -> 5, MISO -> 19, MOSI -> 23
 *   OLED (I2C):  SDA -> 21, SCL -> 22
 *   Status LED:  GPIO 2
 *
 * Dependencies (Install via Library Manager):
 *   - LoRa by Sandeep Mistry
 *   - U8g2 by oliver
 *   - ArduinoJson (v6+)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <ArduinoJson.h>

// ── USER CONFIGURATION ────────────────────────────────────────────────────────

/** WiFi credentials for the gateway hotspot */
const char* WIFI_SSID     = "iPhone (2)";
const char* WIFI_PASSWORD = "mikfahtec";

/**
 * AgroGuard device ID this gateway reports under.
 * Replace "AGR-XXXX-XXXX" with the Device ID generated in the platform (Devices page)
 * when you register a new device as staff.
 */
const char* DEVICE_ID = "AGR-XXXX-XXXX";

/** AgroGuard platform API base URL */
const char* API_HOST = "https://agroguard.tech";

// ── LoRa Configuration (MUST match transmitter) ──────────────────────────────
#define LORA_FREQUENCY 433E6    // 433 MHz
#define SPREADING_FACTOR 7     // SF7
#define BANDWIDTH 250E3        // 250 kHz
#define CODING_RATE 5
#define TX_POWER 17

// ── OLED (SH1106 1.3") ────────────────────────────────────────────────────────
U8G2_SH1106_128X64_NONAME_F_HW_I2C display(U8G2_R0, U8X8_PIN_NONE);

// ── LoRa Pins (ESP32) ─────────────────────────────────────────────────────────
#define LORA_SS   18
#define LORA_RST  14
#define LORA_DIO0 26

// SPI pins for ESP32
#define SPI_SCK   5
#define SPI_MISO  19
#define SPI_MOSI  23

// ── LED ───────────────────────────────────────────────────────────────────────
#define LED_PIN    2

// ── Data Structure ────────────────────────────────────────────────────────────
struct SensorData {
  float moisture;
  float temperature;
  int ec;
  float ph;
  int nitrogen;
  int phosphorus;
  int potassium;
  bool valid;
  int rssi;
  float snr;
  uint16_t packetID;
};

SensorData data;
int packetCount = 0;
int displayPage = 0;
unsigned long lastPacketTime = 0;
unsigned long lastDisplayChange = 0;
bool loraReady = false;

// Auto-rotate interval (5 seconds)
const unsigned long DISPLAY_ROTATE_INTERVAL = 5000;

// ── SETUP ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println(F("\n================================="));
  Serial.println(F("AgroGuard LoRa Receiver / Gateway"));
  Serial.println(F("================================="));

  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // I2C for OLED
  Wire.begin(21, 22);
  Wire.setClock(400000);

  // OLED Init
  Serial.print(F("Initializing OLED..."));
  display.begin();
  display.setFont(u8g2_font_6x10_tf);
  display.setContrast(255);

  display.clearBuffer();
  display.drawStr(35, 15, "AGROGUARD");
  display.drawStr(0, 30, "INITIALIZING...");
  display.sendBuffer();
  Serial.println(F(" OK"));

  delay(1000);

  // Connect to WiFi
  connectWiFi();

  // LoRa Init with correct SPI pins
  Serial.print(F("Initializing LoRa on 433MHz..."));
  
  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, LORA_SS);

  // Reset LoRa module
  pinMode(LORA_RST, OUTPUT);
  digitalWrite(LORA_RST, LOW);
  delay(10);
  digitalWrite(LORA_RST, HIGH);
  delay(10);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  // Initialize LoRa
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println(F(" FAILED!"));

    display.clearBuffer();
    display.drawStr(35, 15, "AGROGUARD");
    display.drawStr(0, 30, "LORA ERROR!");
    display.drawStr(0, 45, "CHECK WIRING");
    display.sendBuffer();

    while (1) {
      digitalWrite(LED_PIN, HIGH);
      delay(200);
      digitalWrite(LED_PIN, LOW);
      delay(200);
    }
  }

  Serial.println(F(" OK"));
  loraReady = true;

  // LoRa Configuration (must match transmitter)
  LoRa.setSpreadingFactor(SPREADING_FACTOR);
  LoRa.setSignalBandwidth(BANDWIDTH);
  LoRa.setCodingRate4(CODING_RATE);
  LoRa.setTxPower(TX_POWER);
  LoRa.enableCrc();

  Serial.println(F("LoRa configured: SF7, BW250kHz, 433MHz"));
  Serial.println(F("System Ready! Waiting for data...\n"));

  data.valid = false;

  // Show ready screen
  display.clearBuffer();
  display.drawStr(35, 15, "AGROGUARD");
  display.drawStr(0, 30, "READY");
  display.drawStr(0, 45, "WAITING FOR DATA");
  display.sendBuffer();

  lastDisplayChange = millis();

  // Ready indication blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

// ── LOOP ──────────────────────────────────────────────────────────────────────
void loop() {
  // Keep the WiFi connection alive
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Receive LoRa packet
  if (loraReady) {
    int packetSize = LoRa.parsePacket();

    if (packetSize > 0) {
      if (packetSize == 28) {
        processPacket();
        lastPacketTime = millis();

        // Flash LED to indicate packet received
        digitalWrite(LED_PIN, HIGH);
        delay(50);
        digitalWrite(LED_PIN, LOW);

        Serial.print(F("PACKET #"));
        Serial.print(data.packetID);
        Serial.print(F(" | RSSI: "));
        Serial.print(data.rssi);
        Serial.print(F(" | SNR: "));
        Serial.print(data.snr);
        Serial.print(F(" | MOISTURE: "));
        Serial.print(data.moisture, 1);
        Serial.print(F("% | TEMP: "));
        Serial.print(data.temperature, 1);
        Serial.print(F("C | PH: "));
        Serial.print(data.ph, 1);
        Serial.print(F(" | N:"));
        Serial.print(data.nitrogen);
        Serial.print(F(" P:"));
        Serial.print(data.phosphorus);
        Serial.print(F(" K:"));
        Serial.println(data.potassium);

        // Forward the reading to the AgroGuard platform
        bool ok = postReading();
        Serial.println(ok ? F("[OK] Forwarded to platform.") : F("[FAIL] Forward failed."));
      } else {
        // Wrong packet size, flush buffer
        while (LoRa.available()) {
          LoRa.read();
        }
      }
    }
  }

  // Timeout after 10 seconds
  if (millis() - lastPacketTime > 10000 && lastPacketTime != 0) {
    if (data.valid) {
      Serial.println(F("[WARN] Timeout - no data for 10 seconds"));
      data.valid = false;
    }
  }

  // Auto-rotate display pages
  if (millis() - lastDisplayChange >= DISPLAY_ROTATE_INTERVAL) {
    displayPage = (displayPage + 1) % 2;
    lastDisplayChange = millis();
  }

  // Refresh display
  static unsigned long lastDisplay = 0;
  if (millis() - lastDisplay > 100) {
    updateDisplay();
    lastDisplay = millis();
  }
}

// ── WIFI CONNECT ──────────────────────────────────────────────────────────────
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 15000UL) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Connection failed - will retry later");
  }
}

// ── HTTP POST FORWARDING ──────────────────────────────────────────────────────
bool postReading() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WIFI] Not connected - skipping HTTP POST"));
    return false;
  }

  HTTPClient http;
  String url = String(API_HOST) + "/api/readings";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Pack the payload in JSON format expected by the API
  StaticJsonDocument<384> doc;
  doc["deviceId"]               = DEVICE_ID;
  doc["soilMoisture"]           = data.moisture;
  doc["temperature"]            = data.temperature;
  doc["electricalConductivity"] = data.ec;
  doc["ph"]                     = data.ph;
  doc["nitrogen"]               = data.nitrogen;
  doc["phosphorus"]             = data.phosphorus;
  doc["potassium"]              = data.potassium;

  String payload;
  serializeJson(doc, payload);

  Serial.println("[HTTP] POST " + url);
  Serial.println("[HTTP] " + payload);

  int code = http.POST(payload);
  Serial.printf("[HTTP] Status Code: %d\n", code);
  
  if (code != 201) {
    Serial.println("[HTTP] Error Response: " + http.getString());
  }
  http.end();
  return (code == 201);
}

// ── PROCESS LORA DATA ─────────────────────────────────────────────────────────
void processPacket() {
  uint8_t buffer[28];
  int i = 0;

  while (LoRa.available() && i < 28) {
    buffer[i++] = LoRa.read();
  }

  data.moisture    = bytesToFloat(&buffer[0]);
  data.temperature = bytesToFloat(&buffer[4]);
  data.ec          = bytesToInt(&buffer[8]);
  data.ph          = bytesToFloat(&buffer[12]);
  data.nitrogen    = bytesToInt(&buffer[16]);
  data.phosphorus  = bytesToInt(&buffer[20]);
  data.potassium   = bytesToInt(&buffer[24]);

  data.valid = true;
  data.rssi = LoRa.packetRssi();
  data.snr  = LoRa.packetSnr();
  data.packetID = packetCount++;
}

// ── OLED RENDERING ────────────────────────────────────────────────────────────
void updateDisplay() {
  if (!data.valid) {
    display.clearBuffer();
    display.setFont(u8g2_font_6x10_tf);
    display.drawStr(35, 15, "AGROGUARD");
    display.drawStr(0, 30, "NO DATA");

    if (lastPacketTime > 0) {
      char buffer[32];
      sprintf(buffer, "LAST: %lu S AGO", (millis() - lastPacketTime) / 1000);
      display.drawStr(0, 45, buffer);
    } else {
      display.drawStr(0, 45, "WAITING...");
    }

    display.sendBuffer();
    return;
  }

  if (displayPage == 0) {
    drawPage1();
  } else {
    drawPage2();
  }
}

void drawPage1() {
  display.clearBuffer();
  char buf[32];
  int y = 0;

  display.setFont(u8g2_font_6x10_tf);
  display.drawStr(35, y + 10, "FARM DATA");
  y += 14;

  sprintf(buf, "MOISTURE : %.1f%%", data.moisture);
  display.drawStr(0, y + 10, buf);
  y += 12;

  sprintf(buf, "TEMP     : %.1f C", data.temperature);
  display.drawStr(0, y + 10, buf);
  y += 12;

  sprintf(buf, "PH       : %.1f", data.ph);
  display.drawStr(0, y + 10, buf);
  y += 12;

  sprintf(buf, "RATE     : 1/SEC");
  display.drawStr(0, y + 10, buf);

  display.sendBuffer();
}

void drawPage2() {
  display.clearBuffer();
  char buf[32];
  int y = 0;

  display.setFont(u8g2_font_6x10_tf);
  display.drawStr(35, y + 10, "FARM DATA");
  y += 14;

  sprintf(buf, "N : %d MG/KG", data.nitrogen);
  display.drawStr(0, y + 10, buf);
  y += 12;

  sprintf(buf, "P : %d MG/KG", data.phosphorus);
  display.drawStr(0, y + 10, buf);
  y += 12;

  sprintf(buf, "K : %d MG/KG", data.potassium);
  display.drawStr(0, y + 10, buf);
  y += 12;

  const char* status;
  if (data.moisture < 30) {
    status = "DRY";
  } else if (data.moisture > 70) {
    status = "WET";
  } else {
    status = "OK";
  }
  sprintf(buf, "STATUS   : %s", status);
  display.drawStr(0, y + 10, buf);

  display.sendBuffer();
}

// ── UTILITY HELPERS ───────────────────────────────────────────────────────────
float bytesToFloat(uint8_t* b) {
  float val;
  memcpy(&val, b, 4);
  return val;
}

int bytesToInt(uint8_t* b) {
  return (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
}
