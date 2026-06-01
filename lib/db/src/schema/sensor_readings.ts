/**
 * Sensor readings table schema
 *
 * Stores all telemetry data sent by ESP32 IoT devices equipped with the
 * 7-in-1 RS485 Modbus soil sensor (also compatible with simpler sensors
 * that only send moisture, temperature, and humidity).
 *
 * 7-in-1 sensor channels:
 *   1. Soil moisture        (%)
 *   2. Soil temperature     (°C)
 *   3. Soil electrical conductivity — EC (mS/m)
 *   4. Soil pH              (0–14)
 *   5. Nitrogen — N         (mg/kg)
 *   6. Phosphorus — P       (mg/kg)
 *   7. Potassium — K        (mg/kg)
 *
 * Plus ambient readings computed/sent by the ESP32:
 *   - Air humidity          (%)
 *   - Heat index            (°C, computed)
 *   - Rainfall              (mm, optional rain gauge)
 *   - Light intensity       (lux, optional photoresistor)
 */
import { pgTable, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sensorReadingsTable = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),

  /** FK to devices.id (internal integer, not the hardware string ID) */
  deviceId: integer("device_id").notNull(),

  // ── Core moisture/climate ─────────────────────────────────────────────────
  /** Soil volumetric water content (0–100 %) */
  soilMoisture: real("soil_moisture").notNull(),
  /** Ambient/soil temperature in Celsius */
  temperature: real("temperature").notNull(),
  /** Relative air humidity (0–100 %) */
  humidity: real("humidity").notNull(),
  /** Computed heat index in Celsius (temperature + humidity combined) */
  heatIndex: real("heat_index").notNull(),

  // ── 7-in-1 soil sensor extra channels ────────────────────────────────────
  /** Soil electrical conductivity in mS/m — indicates salinity and fertility */
  electricalConductivity: real("electrical_conductivity"),
  /** Soil pH (0–14) — acidity/alkalinity */
  ph: real("ph"),
  /** Available Nitrogen (N) content in mg/kg */
  nitrogen: real("nitrogen"),
  /** Available Phosphorus (P) content in mg/kg */
  phosphorus: real("phosphorus"),
  /** Available Potassium (K) content in mg/kg */
  potassium: real("potassium"),

  // ── Optional environmental channels ──────────────────────────────────────
  /** Rainfall accumulation in mm (optional rain gauge) */
  rainfall: real("rainfall"),
  /** Ambient light intensity in lux (optional photoresistor) */
  lightIntensity: real("light_intensity"),

  /** When the sensor captured this reading (device timestamp or server time) */
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type SensorReading = typeof sensorReadingsTable.$inferSelect;
