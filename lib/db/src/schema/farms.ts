import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const farmsTable = pgTable("farms", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  farmSizeHectares: real("farm_size_hectares"),
  cropTypes: text("crop_types"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFarmSchema = createInsertSchema(farmsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farmsTable.$inferSelect;
