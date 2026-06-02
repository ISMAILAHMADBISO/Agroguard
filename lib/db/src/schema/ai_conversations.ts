/**
 * AI Conversations table schema
 * Stores the farming-advisory chat history. Each row is one conversation
 * owned by a single account (staff or farmer); messages are kept inline as
 * a JSONB array so a conversation loads in a single query.
 */
import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** A single chat turn stored inside a conversation. */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const aiConversationsTable = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  /** userId of the owning account */
  ownerId: integer("owner_id").notNull(),
  /** staff | farmer */
  ownerType: text("owner_type").notNull(),
  title: text("title").notNull().default("New conversation"),
  messages: jsonb("messages").$type<ChatMessage[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiConversationSchema = createInsertSchema(aiConversationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversationsTable.$inferSelect;
