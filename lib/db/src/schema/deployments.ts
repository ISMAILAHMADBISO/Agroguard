import { pgTable, serial, varchar, integer, timestamp, pgEnum, text, boolean } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { staffTable } from "./staff";
import { devicesTable } from "./devices";

export const deploymentStatusEnum = pgEnum("deployment_status", [
  "scheduled",
  "in_transit",
  "arrived",
  "installing",
  "testing",
  "completed",
  "failed",
]);

export const deploymentsTable = pgTable("deployments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => ordersTable.id).notNull(),
  fieldOfficerId: integer("field_officer_id").references(() => staffTable.id),
  deviceId: integer("device_id").references(() => devicesTable.id),
  
  status: deploymentStatusEnum("status").default("scheduled").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  
  // Field officer checklist/notes
  powerTested: boolean("power_tested").default(false),
  networkTested: boolean("network_tested").default(false),
  sensorsTested: boolean("sensors_tested").default(false),
  installationNotes: text("installation_notes"),
  
  // Location of installation
  installedLat: text("installed_lat"),
  installedLng: text("installed_lng"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
