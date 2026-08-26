import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email"), displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("idx_users_email").on(table.email)]);

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"), birthDate: text("birth_date"), birthTime: text("birth_time"), birthPlace: text("birth_place"),
  consentedAt: integer("consented_at", { mode: "timestamp_ms" }), createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("idx_profiles_user_id").on(table.userId)]);

export const readingHistory = sqliteTable("reading_history", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readingId: text("reading_id").notNull(), concern: text("concern"), resultJson: text("result_json").notNull(), unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("idx_reading_history_user_created").on(table.userId, table.createdAt)]);

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(), content: text("content").notNull(), createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("idx_conversations_user_created").on(table.userId, table.createdAt)]);

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerCustomerId: text("provider_customer_id"), providerSubscriptionId: text("provider_subscription_id"),
  plan: text("plan", { enum: ["free", "moon", "star"] }).notNull().default("free"), status: text("status").notNull().default("inactive"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }), updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("idx_subscriptions_user_id").on(table.userId), uniqueIndex("idx_subscriptions_provider_id").on(table.providerSubscriptionId)]);
