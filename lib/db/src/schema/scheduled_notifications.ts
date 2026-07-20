import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";

export const scheduledNotificationsTable = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("weekly_tip"), // weekly_tip | seasonal_reminder
  crop: text("crop"),
  region: text("region"),
  season: text("season"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  isSent: boolean("is_sent").default(false),
  createdBy: integer("created_by").references(() => staffTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScheduledNotificationSchema = createInsertSchema(scheduledNotificationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScheduledNotification = z.infer<typeof insertScheduledNotificationSchema>;
export type ScheduledNotification = typeof scheduledNotificationsTable.$inferSelect;
