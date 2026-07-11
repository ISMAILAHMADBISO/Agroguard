import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { devicesTable } from "./devices";
import { staffTable } from "./staff";

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "routine",
  "repair",
  "sensor_replacement",
  "firmware_update",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const maintenanceLogsTable = pgTable("maintenance_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devicesTable.id).notNull(),
  staffId: integer("staff_id").references(() => staffTable.id), // Assigned staff
  type: maintenanceTypeEnum("type").notNull(),
  status: maintenanceStatusEnum("status").default("scheduled").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
