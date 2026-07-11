import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { farmersTable } from "./farmers";
import { devicesTable } from "./devices";
import { staffTable } from "./staff";

export const staffNotesTable = pgTable("staff_notes", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staffTable.id).notNull(), // Author of the note
  farmerId: integer("farmer_id").references(() => farmersTable.id), // Optional: linked to farmer
  deviceId: integer("device_id").references(() => devicesTable.id), // Optional: linked to device
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
