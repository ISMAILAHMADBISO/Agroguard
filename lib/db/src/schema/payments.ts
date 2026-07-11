import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").references(() => farmersTable.id).notNull(),
  paystackReference: text("paystack_reference").notNull().unique(),
  plan: text("plan").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("success"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
