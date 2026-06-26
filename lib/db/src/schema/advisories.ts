import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { farmersTable } from "./farmers";
import { sensorReadingsTable } from "./sensor_readings";

export const advisoriesTable = pgTable("advisories", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  readingId: integer("reading_id").notNull().references(() => sensorReadingsTable.id),
  recommendation: text("recommendation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
