/**
 * Seed Assessments table schema
 * Stores AI seed quality assessments produced from photos uploaded by a farmer.
 */
import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seedAssessmentsTable = pgTable("seed_assessments", {
  id: serial("id").primaryKey(),
  /** FK to farmers.id — optional, the farm this diagnosis concerns */
  farmerId: integer("farmer_id"),
  /** Crop the seed belongs to, e.g. "maize", "tomato" */
  cropType: text("crop_type").notNull(),
  /** Overall quality score 0-100 */
  qualityScore: integer("quality_score").notNull(),
  /** E.g. "Excellent", "Good", "Fair", "Poor" */
  overallQuality: text("overall_quality").notNull(),
  /** Model confidence 0-100 */
  confidence: integer("confidence").notNull(),
  /** Estimated probability of germination 0-100 */
  germinationProbability: integer("germination_probability").notNull(),
  /** E.g. "Healthy", "Minor Damage", "Broken Seeds" */
  physicalCondition: text("physical_condition").notNull(),
  /** E.g. "Very Uniform", "Moderately Uniform" */
  seedUniformity: text("seed_uniformity").notNull(),
  /** E.g. "Loamy", "Clay", "Sandy" */
  recommendedSoilType: text("recommended_soil_type").notNull(),
  /** E.g. "Plant within 7 days", "Keep seeds dry" */
  recommendedPlantingConditions: text("recommended_planting_conditions").notNull(),
  /** E.g. "High", "Medium", "Low" */
  expectedYieldPotential: text("expected_yield_potential").notNull(),
  /** Detailed AI recommendation */
  recommendation: text("recommendation").notNull(),
  /** URLs or references to the uploaded images */
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  
  /** Rating of the assessment helpfulness (1-5 stars) */
  rating: integer("rating"),
  /** Optional feedback comment */
  feedback: text("feedback"),
  /** Date when the feedback was provided */
  feedbackDate: timestamp("feedback_date", { withTimezone: true }),
  
  /** userId of the account that ran the analysis */
  createdBy: integer("created_by").notNull(),
  /** staff | farmer */
  createdByType: text("created_by_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSeedAssessmentSchema = createInsertSchema(seedAssessmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSeedAssessment = z.infer<typeof insertSeedAssessmentSchema>;
export type SeedAssessment = typeof seedAssessmentsTable.$inferSelect;
