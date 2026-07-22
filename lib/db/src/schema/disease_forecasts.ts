import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diseaseForecastsTable = pgTable("disease_forecasts", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id"),
  cropType: text("crop_type").notNull(),
  predictedDisease: text("predicted_disease").notNull(),
  riskLevel: text("risk_level").notNull(), // Low, Moderate, High, Critical
  probability: integer("probability").notNull(),
  confidence: text("confidence").notNull(), // Low, Medium, High, Very High
  expectedTimeWindow: text("expected_time_window").notNull(),
  forecastDrivers: jsonb("forecast_drivers").$type<string[]>().default([]).notNull(),
  recommendedActions: jsonb("recommended_actions").$type<string[]>().default([]).notNull(),
  weatherSummary: text("weather_summary").notNull(),
  occurred: text("occurred"), // Yes, No, Partially
  createdBy: integer("created_by").notNull(),
  createdByType: text("created_by_type").notNull(), // staff | farmer
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiseaseForecastSchema = createInsertSchema(diseaseForecastsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDiseaseForecast = z.infer<typeof insertDiseaseForecastSchema>;
export type DiseaseForecast = typeof diseaseForecastsTable.$inferSelect;
