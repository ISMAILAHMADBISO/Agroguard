/**
 * Staff members table schema
 * Platform staff: admins, agronomists, field officers, and support.
 */
import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  /** super_admin | admin | agronomist | staff */
  role: text("role").notNull().default("staff"),
  /** active | inactive */
  status: text("status").notNull().default("active"),
  department: text("department"),
  passwordHash: text("password_hash"),
  /** Forces a password change on first login (true for admin-created accounts) */
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type StaffMember = typeof staffTable.$inferSelect;
