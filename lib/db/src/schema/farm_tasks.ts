import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const farmTasksTable = pgTable("farm_tasks", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farmsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // pending, completed, overdue
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFarmTaskSchema = createInsertSchema(farmTasksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFarmTask = z.infer<typeof insertFarmTaskSchema>;
export type FarmTask = typeof farmTasksTable.$inferSelect;
