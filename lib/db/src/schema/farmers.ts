/**
 * Farmers table schema
 * Represents smallholder farmers registered on the AgroGuard platform.
 * Each farmer can be linked to one or more IoT devices.
 */
import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmersTable = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  farmName: text("farm_name"),
  farmSizeHectares: real("farm_size_hectares"),
  cropTypes: text("crop_types"),
  /** active | inactive | pending */
  status: text("status").notNull().default("pending"),
  whatsappNumber: text("whatsapp_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmersTable.$inferSelect;
