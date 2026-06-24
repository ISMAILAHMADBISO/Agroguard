// Soil Sensor LoRa Transmitter
#include <SoftwareSerial.h>
#include <SPI.h>
#include <LoRa.h>

// Soil Sensor Pins
#define SOIL_RX 3
#define SOIL_TX 2
#define RE_DE 4

// LoRa Pins
#define LORA_SS 10
#define LORA_RST 9
#define LORA_DIO0 8

// Status LED
#define STATUS_LED 7

SoftwareSerial soilSerial(SOIL_RX, SOIL_TX);

// ================= Unique Identification =================
const uint32_t TRANSMITTER_ID = 54321; // Change this ID for each unique pair

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
const unsigned long interval = 1000; // 1 second interval

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
  Serial.print(F("Soil Sensor LoRa Transmitter ID: "));
  Serial.println(TRANSMITTER_ID);
  Serial.println(F("================================="));
  
  // Initialize LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  
  if (!LoRa.begin(433E6)) {  // 433MHz Frequency
    Serial.println(F("LoRa init failed!"));
    while (1) {
      digitalWrite(STATUS_LED, HIGH);
      delay(200);
      digitalWrite(STATUS_LED, LOW);
      delay(200);
    }
  }
  
  // LoRa Configuration (must match receiver SF7 and BW 250kHz)
  LoRa.setSpreadingFactor(7);      
  LoRa.setSignalBandwidth(250E3);  
  LoRa.setCodingRate4(5);
  LoRa.setTxPower(17);
  LoRa.enableCrc();
  
  Serial.println(F("LoRa initialized successfully!"));
  Serial.println(F("Frequency: 433MHz, SF7, BW250kHz"));
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
  
  if (millis() - lastRSSICheck >= 60000) { // Every minute
    checkLoRaStatus();
    lastRSSICheck = millis();
  }
}

void readSensor() {
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
  int moistureRaw = (frame[3] << 8) | frame[4];
  sensorData.moisture = moistureRaw / 10.0;
  
  int tempRaw = (frame[5] << 8) | frame[6];
  if (tempRaw > 32767) {
    tempRaw = tempRaw - 65536;
  }
  sensorData.temperature = tempRaw / 10.0;
  
  sensorData.ec = (frame[7] << 8) | frame[8];
  
  int phRaw = (frame[9] << 8) | frame[10];
  sensorData.ph = phRaw / 10.0;
  
  sensorData.nitrogen = (frame[11] << 8) | frame[12];
  sensorData.phosphorus = (frame[13] << 8) | frame[14];
  sensorData.potassium = (frame[15] << 8) | frame[16];
  
  sensorData.packetID = packetCounter++;
}

void sendData() {
  uint8_t packet[32]; // Increased to 32 bytes (4 bytes for ID + 28 bytes for data)
  int idx = 0;
  
  // Pack Transmitter ID (first 4 bytes)
  u32ToBytes(TRANSMITTER_ID, &packet[idx]); idx += 4;
  
  // Pack Data (28 bytes)
  floatToBytes(sensorData.moisture, &packet[idx]); idx += 4;
  floatToBytes(sensorData.temperature, &packet[idx]); idx += 4;
  intToBytes(sensorData.ec, &packet[idx]); idx += 4;
  floatToBytes(sensorData.ph, &packet[idx]); idx += 4;
  intToBytes(sensorData.nitrogen, &packet[idx]); idx += 4;
  intToBytes(sensorData.phosphorus, &packet[idx]); idx += 4;
  intToBytes(sensorData.potassium, &packet[idx]); idx += 4;
  
  LoRa.beginPacket();
  LoRa.write(packet, 32);
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

void u32ToBytes(uint32_t value, uint8_t* buffer) {
  buffer[0] = (value >> 24) & 0xFF;
  buffer[1] = (value >> 16) & 0xFF;
  buffer[2] = (value >> 8) & 0xFF;
  buffer[3] = value & 0xFF;
}

void printData() {
  Serial.println(F("\n┌────────────────────────────┐"));
  Serial.print  (F("│ MOISTURE : "));
  Serial.print(sensorData.moisture, 1);
  Serial.println(F(" %        │"));
  Serial.print  (F("│ TEMP     : "));
  Serial.print(sensorData.temperature, 1);
  Serial.println(F(" C        │"));
  Serial.print  (F("│ EC       : "));
  Serial.print(sensorData.ec);
  Serial.println(F(" US       │"));
  Serial.print  (F("│ PH       : "));
  Serial.print(sensorData.ph, 1);
  Serial.println(F("          │"));
  Serial.print  (F("│ N        : "));
  Serial.print(sensorData.nitrogen);
  Serial.println(F(" MG/KG    │"));
  Serial.print  (F("│ P        : "));
  Serial.print(sensorData.phosphorus);
  Serial.println(F(" MG/KG    │"));
  Serial.print  (F("│ K        : "));
  Serial.print(sensorData.potassium);
  Serial.println(F(" MG/KG    │"));
  Serial.println(F("└────────────────────────────┘"));
  Serial.print(F("PACKET #"));
  Serial.println(sensorData.packetID);
}
