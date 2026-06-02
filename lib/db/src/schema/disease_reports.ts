/**
 * Disease Reports table schema
 * Stores AI crop-disease diagnoses produced from a photo uploaded by a
 * farmer or staff member. The image itself is not persisted — only the
 * structured diagnosis returned by the vision model.
 */
import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diseaseReportsTable = pgTable("disease_reports", {
  id: serial("id").primaryKey(),
  /** FK to farmers.id — optional, the farm this diagnosis concerns */
  farmerId: integer("farmer_id"),
  /** Crop the photo is of, e.g. "maize", "tomato", "cassava" */
  cropType: text("crop_type"),
  /** Detected disease / condition name, or "Healthy" */
  diagnosis: text("diagnosis").notNull(),
  /** Model confidence, 0–100 */
  confidence: integer("confidence").notNull(),
  /** low | medium | high */
  severity: text("severity").notNull(),
  /** Recommended treatment / next steps */
  treatment: text("treatment").notNull(),
  /** Short human-readable summary of the visual findings */
  summary: text("summary").notNull(),
  /** userId of the account that ran the analysis */
  createdBy: integer("created_by").notNull(),
  /** staff | farmer */
  createdByType: text("created_by_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiseaseReportSchema = createInsertSchema(diseaseReportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDiseaseReport = z.infer<typeof insertDiseaseReportSchema>;
export type DiseaseReport = typeof diseaseReportsTable.$inferSelect;
