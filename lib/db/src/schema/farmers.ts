/**
 * Farmers table schema
 * Represents smallholder farmers registered on the AgroGuard platform.
 * Each farmer can be linked to one or more IoT devices.
 */
import { pgTable, text, serial, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmersTable = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  farmName: text("farm_name"),
  farmSizeHectares: real("farm_size_hectares"),
  cropTypes: text("crop_types"),
  /** active | inactive | pending */
  status: text("status").notNull().default("pending"),
  whatsappNumber: text("whatsapp_number"),
  notes: text("notes"),
  /** FK to staff.id — field officer/staff assigned to this farmer */
  fieldOfficerId: integer("field_officer_id"),
  /** Farmer login credentials — farmers can sign in to see only their own data */
  passwordHash: text("password_hash"),
  /** Forces a password change on first login (true for admin/staff-created accounts) */
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  /** One-time activation token sent via email/WhatsApp for account activation */
  activationToken: text("activation_token"),
  /** AI Usage quotas */
  subscriptionPlan: text("subscription_plan").notNull().default("free"),
  subscriptionStartDate: timestamp("subscription_start_date", { withTimezone: true }),
  subscriptionExpiryDate: timestamp("subscription_expiry_date", { withTimezone: true }),
  aiChatUsageCount: integer("ai_chat_usage_count").notNull().default(0),
  aiDiseaseUsageCount: integer("ai_disease_usage_count").notNull().default(0),
  aiUsageDate: timestamp("ai_usage_date", { withTimezone: true }),
  /** User's preferred language (en, fr, ha, ar, sw) */
  preferredLanguage: text("preferred_language").notNull().default("en"),
  /** JSON object storing notification preferences (email, sms, in-app) */
  notificationPreferences: jsonb("notification_preferences").default({ email: true, sms: false, inApp: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmersTable.$inferSelect;
