import { pgTable, serial, text, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { staffTable } from "./staff";

export const systemLogsTable = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 20 }).notNull().default("info"), // info, warning, error, critical
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description").notNull(),
  actorId: integer("actor_id").references(() => staffTable.id), // Staff who performed the action (if applicable)
  targetResource: varchar("target_resource", { length: 100 }), // e.g. "device_42", "inventory_scan"
  ipAddress: varchar("ip_address", { length: 45 }),
  device: varchar("device", { length: 255 }), // User agent or device info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
