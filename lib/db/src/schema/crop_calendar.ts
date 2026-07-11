import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const cropCalendarTable = pgTable("crop_calendar", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farmsTable.id),
  eventType: text("event_type").notNull(), // irrigation, fertilizer, harvest, pest_control
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCropCalendarSchema = createInsertSchema(cropCalendarTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCropCalendar = z.infer<typeof insertCropCalendarSchema>;
export type CropCalendar = typeof cropCalendarTable.$inferSelect;
