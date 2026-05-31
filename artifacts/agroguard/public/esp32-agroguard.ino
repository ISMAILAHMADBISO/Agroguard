/**
 * AgroGuard ESP32 Sensor Node — Firmware v1.0
 * ============================================
 * Hardware required:
 *   - ESP32 development board (e.g. DOIT ESP32 DevKit V1)
 *   - DHT22 sensor  → data pin D4 (GPIO 4)
 *   - Capacitive soil moisture sensor → analog pin A0 (GPIO 34)
 *   - (Optional) Rain sensor analog output → GPIO 35
 *
 * Libraries (install via Arduino Library Manager):
 *   - DHT sensor library by Adafruit
 *   - ArduinoJson by Benoit Blanchon (v6.x)
 *   - WiFiClientSecure (built-in ESP32 Arduino core)
 *   - HTTPClient (built-in ESP32 Arduino core)
 *
 * Setup steps:
 *   1. Register this device in AgroGuard > Devices with a matching DEVICE_ID.
 *   2. Assign it to a farmer in the Device detail page.
 *   3. Flash this sketch and open Serial Monitor at 115200 baud.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// WiFi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// AgroGuard server — your Replit domain (no trailing slash)
// Example: "https://agroguard.yourusername.repl.co"
const char* SERVER_HOST   = "https://YOUR_REPLIT_DOMAIN";
const char* READINGS_PATH = "/api/readings";

// Device ID — must match exactly what is registered in AgroGuard > Devices
// Example: "ESP32-AGG-001"
const char* DEVICE_ID     = "ESP32-AGG-001";

// How often to send a reading (milliseconds) — 30 seconds
const unsigned long SEND_INTERVAL_MS = 30000;

// ─── PIN DEFINITIONS ──────────────────────────────────────────────────────────
#define DHT_PIN           4       // GPIO 4 — DHT22 data
#define DHT_TYPE          DHT22
#define SOIL_MOISTURE_PIN 34      // GPIO 34 — capacitive soil moisture (ADC)
#define RAIN_SENSOR_PIN   35      // GPIO 35 — analog rain sensor (optional)

// Soil moisture ADC calibration:
//   DRY_VALUE  = raw ADC reading when sensor is in dry air
//   WET_VALUE  = raw ADC reading when sensor is submerged in water
const int SOIL_DRY_VALUE  = 3200;
const int SOIL_WET_VALUE  = 1400;

// ─── GLOBALS ──────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSendTime = 0;
WiFiClientSecure wifiClient;

// ─── SETUP ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== AgroGuard ESP32 Sensor Node v1.0 ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  dht.begin();

  // Configure ADC resolution (12-bit = 0-4095)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // allows reading up to ~3.3V

  // Connect to WiFi
  connectWiFi();

  // Accept any TLS certificate (suitable for dev; use setCACert() in production)
  wifiClient.setInsecure();

  Serial.println("Setup complete. Starting sensor loop.");
}

// ─── LOOP ─────────────────────────────────────────────────────────────────────
void loop() {
  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection lost — reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS || lastSendTime == 0) {
    lastSendTime = now;
    readAndSend();
  }
}

// ─── READ SENSORS & POST TO AGROGUARD ─────────────────────────────────────────
void readAndSend() {
  // Read DHT22
  float temperature  = dht.readTemperature();   // Celsius
  float humidity     = dht.readHumidity();       // %RH

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[DHT22] Read failed — check wiring. Skipping this cycle.");
    return;
  }

  // Calculate heat index (Celsius)
  float heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  // Read soil moisture and convert to percentage
  int rawSoil       = analogRead(SOIL_MOISTURE_PIN);
  float soilMoisture = mapFloat(rawSoil, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0.0, 100.0);
  soilMoisture       = constrain(soilMoisture, 0.0, 100.0);

  // Read rain sensor (optional — set to null if not connected)
  int rawRain        = analogRead(RAIN_SENSOR_PIN);
  float rainfall     = mapFloat(rawRain, 4095, 0, 0.0, 25.0); // 0–25 mm approximation

  // Print to Serial Monitor
  Serial.printf("\n[SENSOR] Temp: %.1f°C  Humidity: %.1f%%  HeatIdx: %.1f°C  Soil: %.1f%%  Rain: %.1fmm\n",
                temperature, humidity, heatIndex, soilMoisture, rainfall);

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["temperature"]  = round2dp(temperature);
  doc["humidity"]     = round2dp(humidity);
  doc["heatIndex"]    = round2dp(heatIndex);
  doc["soilMoisture"] = round2dp(soilMoisture);
  doc["rainfall"]     = round2dp(rainfall);

  String payload;
  serializeJson(doc, payload);

  // POST to AgroGuard
  String url = String(SERVER_HOST) + READINGS_PATH;
  HTTPClient http;
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout

  int responseCode = http.POST(payload);

  if (responseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] %d — %s\n", responseCode, responseCode == 201 ? "Reading saved" : response.c_str());
  } else {
    Serial.printf("[HTTP] Error: %s\n", http.errorToString(responseCode).c_str());
  }

  http.end();
}

// ─── WIFI HELPER ──────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Failed to connect — will retry in loop.");
  }
}

// ─── UTILITY HELPERS ──────────────────────────────────────────────────────────
float mapFloat(float x, float inMin, float inMax, float outMin, float outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

float round2dp(float val) {
  return roundf(val * 100.0f) / 100.0f;
}
