import { pgTable, serial, varchar, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { devicesTable } from "./devices";

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "available",
  "reserved",
  "installed",
  "repair",
  "decommissioned",
]);

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  productType: varchar("product_type", { length: 50 }).notNull(), // standard, premium
  status: inventoryStatusEnum("status").default("available").notNull(),
  deviceId: integer("device_id").references(() => devicesTable.id), // Link to deployed device if installed
  manufacturingDate: timestamp("manufacturing_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
