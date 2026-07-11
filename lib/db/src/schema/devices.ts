/**
 * Devices table schema
 * Represents ESP32-based IoT sensor devices registered on the platform.
 * Devices are assigned to farmers by admin and send sensor data to the API.
 */
import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  /** Unique hardware identifier — ESP32 chip ID */
  deviceId: text("device_id").notNull().unique(),
  name: text("name").notNull(),
  /** FK to farmers.id — null means unassigned */
  farmerId: integer("farmer_id"),
  /** FK to farms.id — which specific farm this device is in */
  farmId: integer("farm_id").references(() => farmsTable.id),
  location: text("location"),
  /** online | offline | maintenance */
  status: text("status").notNull().default("offline"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  firmwareVersion: text("firmware_version"),
  batteryLevel: real("battery_level"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
