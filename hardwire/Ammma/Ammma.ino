#define BLYNK_TEMPLATE_ID "TMPL4qb3EHClU"
#define BLYNK_TEMPLATE_NAME "Rice Monitoring System"
#define BLYNK_AUTH_TOKEN "_VrWO-y6ln5ObVGnrbzDkGEzCxC5AEhf"

#define BLYNK_PRINT Serial

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

//================= WiFi =================
char ssid[] = "MULLARGLO";
char pass[] = "12345678";

//================= DHT22 =================
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

//================= Soil Sensor =================
#define SOIL_PIN 34

// Calibrate these values if needed
#define DRY_VALUE 2300
#define WET_VALUE 350

//================= Outputs =================
#define BUZZER   25
#define RED_LED  26
#define BLUE_LED 27

//================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

//================= Timer =================
BlynkTimer timer;

// LCD Page Control
int lcdPage = 0;

// Store latest readings
float temperature = 0;
float humidity = 0;
float heatIndex = 0;
int soil = 0;
int soilRaw = 0;
bool abnormal = false;

void updateLCD()
{
  lcd.home();
lcd.print("                ");
lcd.setCursor(0,1);
lcd.print("                ");
lcd.home();

  switch (lcdPage)
  {
    case 0:
      lcd.setCursor(0,0);
      lcd.print("Temp:");
      lcd.print(temperature,1);
      lcd.print((char)223);
      lcd.print("C");

      lcd.setCursor(0,1);
      lcd.print("Hum:");
      lcd.print(humidity,1);
      lcd.print("%");
      break;

    case 1:
      lcd.setCursor(0,0);
      lcd.print("Heat:");
      lcd.print(heatIndex,1);
      lcd.print((char)223);
      lcd.print("C");

      lcd.setCursor(0,1);
      lcd.print("Soil:");
      lcd.print(soil);
      lcd.print("%");
      break;

    case 2:
      lcd.setCursor(0,0);
      lcd.print("Raw:");
      lcd.print(soilRaw);

      lcd.setCursor(0,1);

      if(abnormal)
      {
        lcd.print("Status:BAD");
      }
      else
      {
        lcd.print("Status:GOOD");
      }

      break;
  }

  lcdPage++;

  if(lcdPage>2)
    lcdPage=0;
}

//==================================================
void sendData()
{
 temperature = dht.readTemperature();
humidity = dht.readHumidity();

if (isnan(temperature) || isnan(humidity))
  {
    Serial.println("Failed to read DHT22!");
    return;
  }
heatIndex = dht.computeHeatIndex(temperature, humidity, false);

  // Read Soil Sensor
 long total = 0;

for (int i = 0; i < 10; i++)
{
    total += analogRead(SOIL_PIN);
    delay(5);
}

soilRaw = total / 10;

  soil = map(soilRaw, DRY_VALUE, WET_VALUE, 0, 100);
soil = constrain(soil,0,100);

  //================= Serial Monitor =================
  Serial.println("--------------------------------");
  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity    : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Heat Index  : ");
  Serial.print(heatIndex);
  Serial.println(" °C");

  Serial.print("Raw Soil    : ");
  Serial.println(soilRaw);

  Serial.print("Soil Moist. : ");
Serial.print(soil);
Serial.println(" %");

if (soil <= 35)
{
    Serial.println("Status      : ABNORMAL");
}
else
{
    Serial.println("Status      : NORMAL");
}

Serial.println("--------------------------------");

  //================= Blynk =================
Blynk.virtualWrite(V0, temperature);
Blynk.virtualWrite(V1, humidity);
Blynk.virtualWrite(V2, heatIndex);
  Blynk.virtualWrite(V6, soil);

  //================= Alert Logic =================
  if (soil <= 35)
  {
    abnormal = true;
    digitalWrite(BUZZER, HIGH);
    digitalWrite(RED_LED, HIGH);
    digitalWrite(BLUE_LED, LOW);

    Blynk.virtualWrite(V3, 1);
    Blynk.virtualWrite(V4, 1);
    Blynk.virtualWrite(V5, 0);
  }
 else
{
    abnormal = false;

    digitalWrite(BUZZER,LOW);
    digitalWrite(RED_LED,LOW);
    digitalWrite(BLUE_LED,HIGH);

    Blynk.virtualWrite(V3,0);
    Blynk.virtualWrite(V4,0);
    Blynk.virtualWrite(V5,1);
}
}

//==================================================
BLYNK_WRITE(V3)
{
  digitalWrite(BUZZER, param.asInt());
}

//==================================================
void setup()
{
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(SOIL_PIN, INPUT);

  digitalWrite(BUZZER, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BLUE_LED, LOW);

  // Initialize I2C
  Wire.begin(21, 22);

  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Rice Monitor");
  lcd.setCursor(0,1);
  lcd.print("Connecting...");

  dht.begin();

  //================= WiFi =================
  WiFi.begin(ssid, pass);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  //================= Blynk =================
  Blynk.config(BLYNK_AUTH_TOKEN);

  if (Blynk.connect())
  {
    Serial.println("Blynk Connected!");

    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("System Ready");
    lcd.setCursor(0,1);
    lcd.print("Connected");
    delay(2000);
    updateLCD();
  }
  else
  {
    Serial.println("Blynk Connection Failed!");

    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Blynk Error");
  }

  timer.setInterval(2000L, sendData);
  timer.setInterval(1000L, updateLCD);
}

//==================================================
void loop()
{
  if (!Blynk.connected())
  {
    Blynk.connect();
  }

  Blynk.run();
  timer.run();
}
