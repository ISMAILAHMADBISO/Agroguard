/**
 * AgroGuard LoRa Transmitter — Field Node (Arduino Uno / Nano)
 * ===========================================================
 * Reads a 7-in-1 RS485 Modbus soil sensor and broadcasts the readings over
 * LoRa to the AgroGuard gateway (see agroguard-lora-receiver-esp32.ino), which
 * forwards them to the platform over WiFi. Use this pair where the field has no
 * WiFi coverage but the gateway does.
 *
 * Compatible hardware:
 *   - Arduino Uno / Nano (5 V)
 *   - SX1278 / RA-02 LoRa module
 *   - 7-in-1 RS485 soil sensor (Modbus RTU) via a MAX485 transceiver
 *
 * Wiring:
 *   Soil sensor (via MAX485):  RO → D2, DI → D3, DE+RE → D4
 *   LoRa (SPI):                NSS → D10, RST → D9, DIO0 → D8,
 *                              SCK → D13, MISO → D12, MOSI → D11
 *   Status LED:                D7
 *
 * Dependencies (Arduino Library Manager):
 *   - LoRa by Sandeep Mistry
 *
 * IMPORTANT — frequency:
 *   The transmitter and receiver MUST use the SAME LoRa frequency. This sketch
 *   and the ESP32 receiver both use 868 MHz (EU). If you are in the US, change
 *   BOTH to 915E6; for the 433 MHz band change BOTH to 433E6. A mismatch means
 *   no packets are ever received.
 */

#include <SoftwareSerial.h>
#include <SPI.h>
#include <LoRa.h>

// ── LoRa band — MUST match the receiver ───────────────────────────────────────
#define LORA_FREQUENCY 868E6   // 868 MHz (EU). Use 915E6 (US) or 433E6 — same on both ends.

// Soil Sensor Pins
#define SOIL_RX 2
#define SOIL_TX 3
#define RE_DE 4

// LoRa Pins
#define LORA_SS 10
#define LORA_RST 9
#define LORA_DIO0 8

// Status LED
#define STATUS_LED 7

SoftwareSerial soilSerial(SOIL_RX, SOIL_TX);

// Modbus request for reading 7 registers
byte request[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x07, 0x04, 0x08};
byte response[32];

struct SensorData {
  float moisture;
  float temperature;
  int ec;
  float ph;
  int nitrogen;
  int phosphorus;
  int potassium;
  uint16_t packetID;
};

SensorData sensorData;
uint16_t packetCounter = 0;
unsigned long lastReadTime = 0;
unsigned long lastSendTime = 0;
const unsigned long interval = 10000; // 10 seconds

// For signal testing
unsigned long lastRSSICheck = 0;

void setup() {
  Serial.begin(9600);
  soilSerial.begin(4800);

  pinMode(RE_DE, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(RE_DE, LOW);
  digitalWrite(STATUS_LED, LOW);

  Serial.println(F("\n================================="));
  Serial.println(F("AgroGuard LoRa Transmitter"));
  Serial.println(F("================================="));

  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println(F("LoRa init failed!"));
    while (1) {
      digitalWrite(STATUS_LED, HIGH);
      delay(200);
      digitalWrite(STATUS_LED, LOW);
      delay(200);
    }
  }

  // LoRa Configuration for long range
  LoRa.setSpreadingFactor(12);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);
  LoRa.setTxPower(17);  // Max power
  LoRa.enableCrc();

  Serial.println(F("LoRa initialized successfully!"));
  Serial.println(F("Frequency: 868MHz, SF12, BW125kHz"));
  Serial.println(F("Waiting for sensor data...\n"));

  // Ready indication
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(100);
    digitalWrite(STATUS_LED, LOW);
    delay(100);
  }
}

void loop() {
  if (millis() - lastReadTime >= interval) {
    readSensor();
    lastReadTime = millis();
  }

  if (millis() - lastSendTime >= interval) {
    sendData();
    lastSendTime = millis();
  }

  // Optional: Check LoRa status periodically
  if (millis() - lastRSSICheck >= 60000) { // Every minute
    checkLoRaStatus();
    lastRSSICheck = millis();
  }
}

void readSensor() {
  // Clear buffer
  while (soilSerial.available()) {
    soilSerial.read();
  }

  // Send Modbus request
  digitalWrite(RE_DE, HIGH);
  delay(10);
  soilSerial.write(request, 8);
  soilSerial.flush();
  delay(5);
  digitalWrite(RE_DE, LOW);

  delay(300);

  int bytesAvailable = soilSerial.available();

  if (bytesAvailable >= 19) {
    for (int i = 0; i < bytesAvailable && i < 32; i++) {
      response[i] = soilSerial.read();
    }

    int startIndex = findModbusFrame(response, bytesAvailable);

    if (startIndex >= 0 && (bytesAvailable - startIndex) >= 19) {
      parseModbusFrame(&response[startIndex]);
      Serial.println(F("Sensor reading successful"));
      digitalWrite(STATUS_LED, HIGH);
      delay(50);
      digitalWrite(STATUS_LED, LOW);
    } else {
      Serial.println(F("Invalid Modbus frame"));
    }
  } else {
    Serial.println(F("No sensor response"));
  }
}

int findModbusFrame(byte* data, int length) {
  for (int i = 0; i < length - 1; i++) {
    if (data[i] == 0x01 && data[i + 1] == 0x03) {
      return i;
    }
  }
  return -1;
}

void parseModbusFrame(byte* frame) {
  // Moisture (expanded by 10)
  int moistureRaw = (frame[3] << 8) | frame[4];
  sensorData.moisture = moistureRaw / 10.0;

  // Temperature (expanded by 10, may be negative)
  int tempRaw = (frame[5] << 8) | frame[6];
  if (tempRaw > 32767) {
    tempRaw = tempRaw - 65536;
  }
  sensorData.temperature = tempRaw / 10.0;

  // EC
  sensorData.ec = (frame[7] << 8) | frame[8];

  // pH (expanded by 10)
  int phRaw = (frame[9] << 8) | frame[10];
  sensorData.ph = phRaw / 10.0;

  // NPK
  sensorData.nitrogen = (frame[11] << 8) | frame[12];
  sensorData.phosphorus = (frame[13] << 8) | frame[14];
  sensorData.potassium = (frame[15] << 8) | frame[16];

  sensorData.packetID = packetCounter++;
}

void sendData() {
  uint8_t packet[28];
  int idx = 0;

  // Pack all data into 28 bytes
  floatToBytes(sensorData.moisture, &packet[idx]); idx += 4;
  floatToBytes(sensorData.temperature, &packet[idx]); idx += 4;
  intToBytes(sensorData.ec, &packet[idx]); idx += 4;
  floatToBytes(sensorData.ph, &packet[idx]); idx += 4;
  intToBytes(sensorData.nitrogen, &packet[idx]); idx += 4;
  intToBytes(sensorData.phosphorus, &packet[idx]); idx += 4;
  intToBytes(sensorData.potassium, &packet[idx]); idx += 4;

  // Send LoRa packet
  LoRa.beginPacket();
  LoRa.write(packet, 28);
  LoRa.endPacket();

  printData();
}

void checkLoRaStatus() {
  Serial.println(F("\n--- LoRa Status ---"));
  Serial.print(F("Packets sent: "));
  Serial.println(packetCounter);
  Serial.println(F("-------------------\n"));
}

void floatToBytes(float value, uint8_t* buffer) {
  memcpy(buffer, &value, 4);
}

void intToBytes(int value, uint8_t* buffer) {
  buffer[0] = (value >> 24) & 0xFF;
  buffer[1] = (value >> 16) & 0xFF;
  buffer[2] = (value >> 8) & 0xFF;
  buffer[3] = value & 0xFF;
}

void printData() {
  Serial.println(F("\n--- READING ---"));
  Serial.print(F("MOISTURE : ")); Serial.print(sensorData.moisture, 1); Serial.println(F(" %"));
  Serial.print(F("TEMP     : ")); Serial.print(sensorData.temperature, 1); Serial.println(F(" C"));
  Serial.print(F("EC       : ")); Serial.print(sensorData.ec); Serial.println(F(" mS/m"));
  Serial.print(F("PH       : ")); Serial.println(sensorData.ph, 1);
  Serial.print(F("N        : ")); Serial.print(sensorData.nitrogen); Serial.println(F(" mg/kg"));
  Serial.print(F("P        : ")); Serial.print(sensorData.phosphorus); Serial.println(F(" mg/kg"));
  Serial.print(F("K        : ")); Serial.print(sensorData.potassium); Serial.println(F(" mg/kg"));
  Serial.print(F("PACKET #")); Serial.println(sensorData.packetID);
}
