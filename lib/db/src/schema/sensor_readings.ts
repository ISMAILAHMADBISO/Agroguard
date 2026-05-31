/**
 * Sensor readings table schema
 * Stores all telemetry data sent by ESP32 IoT devices.
 * Metrics: soil moisture, temperature, humidity, heat index, rainfall, light intensity.
 */
import { pgTable, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sensorReadingsTable = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  /** FK to devices.id */
  deviceId: integer("device_id").notNull(),
  /** Soil moisture percentage (0–100) */
  soilMoisture: real("soil_moisture").notNull(),
  /** Temperature in Celsius */
  temperature: real("temperature").notNull(),
  /** Relative humidity percentage (0–100) */
  humidity: real("humidity").notNull(),
  /** Computed heat index in Celsius */
  heatIndex: real("heat_index").notNull(),
  /** Rainfall in mm (optional) */
  rainfall: real("rainfall"),
  /** Light intensity in lux (optional) */
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
