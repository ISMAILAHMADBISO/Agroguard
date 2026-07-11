import { pgTable, serial, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { farmersTable } from "./farmers";

export const orderStatusEnum = pgEnum("order_status", [
  "pending_review",
  "payment_verified",
  "approved",
  "installation_scheduled",
  "officer_assigned",
  "installation_in_progress",
  "installed",
  "activated",
  "completed",
  "cancelled",
]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").references(() => farmersTable.id),
  
  // Product info
  productType: varchar("product_type", { length: 50 }).notNull(), // 'standard' or 'premium'
  price: integer("price").notNull(),
  
  // Farm Delivery Info
  farmName: varchar("farm_name", { length: 100 }),
  farmAddress: varchar("farm_address", { length: 255 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  lga: varchar("lga", { length: 100 }).notNull(),
  farmSizeHectares: integer("farm_size_hectares"),
  cropTypes: varchar("crop_types", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  
  // Payment
  paystackReference: varchar("paystack_reference", { length: 100 }).unique(),
  
  // Status Tracking
  status: orderStatusEnum("status").default("pending_review").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
