// Soil Sensor LoRa Receiver (ESP32)
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ================= WiFi & Web Configurations =================
const char* ssid = "MULLARGLO";          
const char* password = "12345678";  
const char* serverUrl = "https://agroguard-agroguard-self.vercel.app/api/readings"; // Corrected API Endpoint
const char* deviceId = "AGR-VZUQ-ZAGR";       

// ================= Unique ID Filtering =================
const uint32_t EXPECTED_TRANSMITTER_ID = 54321; // Must match transmitter ID

// ================= OLED (SH1106 1.3") =================
U8G2_SH1106_128X64_NONAME_F_HW_I2C display(U8G2_R0, U8X8_PIN_NONE);

// ================= LoRa Pins (ESP32) =================
#define LORA_SS   18
#define LORA_RST  14
#define LORA_DIO0 26

// SPI pins for ESP32
#define SPI_SCK   5
#define SPI_MISO  19
#define SPI_MOSI  23

// ================= LED =================
#define LED_PIN    2

// ================= Data Structure =================
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

// ================= WiFi Connection Helper =================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.print(F("Connecting to WiFi: "));
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\nWiFi Connected!"));
    Serial.print(F("IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\nWiFi Connection Failed. Will retry on next packet."));
  }
}

// ================= POST Data to Website =================
void sendDataToWebsite() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("Posting data to Vercel..."));
    
    WiFiClientSecure client;
    client.setInsecure(); // Bypass SSL verification checks
    
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

    // Format JSON payload matching schema
    String jsonPayload = "{\"deviceId\":\"" + String(deviceId) + "\""
                       + ",\"soilMoisture\":" + String(data.moisture, 2)
                       + ",\"temperature\":" + String(data.temperature, 2)
                       + ",\"humidity\":0.0"   
                       + ",\"heatIndex\":0.0"  
                       + ",\"electricalConductivity\":" + String(data.ec)
                       + ",\"ph\":" + String(data.ph, 2)
                       + ",\"nitrogen\":" + String(data.nitrogen)
                       + ",\"phosphorus\":" + String(data.phosphorus)
                       + ",\"potassium\":" + String(data.potassium)
                       + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print(F("HTTP Success! Response Code: "));
      Serial.println(httpResponseCode);
      
      // Print server response body if error occurs
      if (httpResponseCode != 201) {
        String response = http.getString();
        Serial.print(F("Server Response: "));
        Serial.println(response);
      }
    } else {
      Serial.print(F("HTTP Error! Code: "));
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println(F("\n================================="));
  Serial.print(F("Soil Sensor LoRa Receiver Target ID: "));
  Serial.println(EXPECTED_TRANSMITTER_ID);
  Serial.println(F("================================="));

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Connect to WiFi
  connectWiFi();

  // I2C for OLED
  Wire.begin(21, 22);
  Wire.setClock(400000);

  // OLED Init
  Serial.print(F("Initializing OLED..."));
  display.begin();
  display.setFont(u8g2_font_6x10_tf);
  display.setContrast(255);
  
  display.clearBuffer();
  display.drawStr(35, 15, "FARM DATA");
  display.drawStr(0, 30, "INITIALIZING...");
  display.sendBuffer();
  Serial.println(F(" OK"));

  delay(1000);

  // LoRa Init
  Serial.print(F("Initializing LoRa on 433MHz..."));
  
  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, LORA_SS);
  
  pinMode(LORA_RST, OUTPUT);
  digitalWrite(LORA_RST, LOW);
  delay(10);
  digitalWrite(LORA_RST, HIGH);
  delay(10);
  
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  
  if (!LoRa.begin(433E6)) {
    Serial.println(F(" FAILED!"));
    
    display.clearBuffer();
    display.drawStr(35, 15, "FARM DATA");
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

  // LoRa Configuration
  LoRa.setSpreadingFactor(7);      
  LoRa.setSignalBandwidth(250E3);  
  LoRa.setCodingRate4(5);
  LoRa.setTxPower(17);
  LoRa.enableCrc();
  
  Serial.println(F("LoRa configured: SF7, BW250kHz, 433MHz"));
  Serial.println(F("System Ready! Receiving 1 packet/sec...\n"));

  data.valid = false;

  display.clearBuffer();
  display.drawStr(35, 15, "FARM DATA");
  display.drawStr(0, 30, "READY");
  display.drawStr(0, 45, "RECEIVING DATA");
  display.sendBuffer();

  lastDisplayChange = millis();

  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

// ================= LOOP =================
void loop() {
  if (loraReady) {
    int packetSize = LoRa.parsePacket();

    if (packetSize > 0) {
      if (packetSize == 32) { // Expect 32 bytes (4 ID + 28 Data)
        processPacket();
        lastPacketTime = millis();
        
        digitalWrite(LED_PIN, HIGH);
        delay(10);  
        digitalWrite(LED_PIN, LOW);
        
        if (packetCount % 10 == 0 && data.valid) {
          Serial.print(F("PACKET #"));
          Serial.print(data.packetID);
          Serial.print(F(" | RSSI: "));
          Serial.print(data.rssi);
          Serial.print(F(" | SNR: "));
          Serial.print(data.snr);
          Serial.print(F(" | MOISTURE: "));
          Serial.print(data.moisture, 1);
          Serial.print(F("% | RATE: 1/sec\n"));
        }
      } else {
        while (LoRa.available()) {
          LoRa.read();
        }
      }
    }
  }

  // Timeout after 3 seconds
  if (millis() - lastPacketTime > 3000 && lastPacketTime != 0) {
    if (data.valid) {
      Serial.println(F("⚠️ NO PACKETS FOR 3 SECONDS"));
      data.valid = false;
    }
  }

  // Auto-rotate display every 5 seconds
  if (millis() - lastDisplayChange >= DISPLAY_ROTATE_INTERVAL) {
    displayPage = (displayPage + 1) % 2;
    lastDisplayChange = millis();
  }

  // Display Update
  static unsigned long lastDisplay = 0;
  if (millis() - lastDisplay > 100) {
    updateDisplay();
    lastDisplay = millis();
  }
}

void processPacket() {
  uint8_t buffer[32];
  int i = 0;

  while (LoRa.available() && i < 32) {
    buffer[i++] = LoRa.read();
  }

  // Extract transmitter ID (first 4 bytes)
  uint32_t rxTransmitterID = bytesToU32(&buffer[0]);

  if (rxTransmitterID != EXPECTED_TRANSMITTER_ID) {
    Serial.print(F("⚠️ IGNORED: Packet from unauthorized transmitter ID: "));
    Serial.println(rxTransmitterID);
    return; // Drop packet
  }

  // Parse remaining 28 bytes
  data.moisture    = bytesToFloat(&buffer[4]);
  data.temperature = bytesToFloat(&buffer[8]);
  data.ec          = bytesToInt(&buffer[12]);
  data.ph          = bytesToFloat(&buffer[16]);
  data.nitrogen    = bytesToInt(&buffer[20]);
  data.phosphorus  = bytesToInt(&buffer[24]);
  data.potassium   = bytesToInt(&buffer[28]);

  data.valid = true;
  data.rssi = LoRa.packetRssi();
  data.snr  = LoRa.packetSnr();
  data.packetID = packetCount++;

  // Send the received data to the Vercel website
  sendDataToWebsite();
}

void updateDisplay() {
  if (!data.valid) {
    display.clearBuffer();
    display.setFont(u8g2_font_6x10_tf);
    display.drawStr(35, 15, "FARM DATA");
    display.drawStr(0, 30, "NO DATA");
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

float bytesToFloat(uint8_t* b) {
  float val;
  memcpy(&val, b, 4);
  return val;
}

int bytesToInt(uint8_t* b) {
  return (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
}

uint32_t bytesToU32(uint8_t* b) {
  return ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) | ((uint32_t)b[2] << 8) | b[3];
}
