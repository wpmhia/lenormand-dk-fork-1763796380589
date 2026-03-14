import { pgTable, serial, text, date, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const tierEnum = pgEnum("tier", ["free", "unlimited"]);
export const membershipStatusEnum = pgEnum("membership_status", ["active", "cancelled", "expired"]);

export const readingUsage = pgTable("reading_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  count: integer("count").default(0).notNull(),
});

export const memberships = pgTable("memberships", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  tier: tierEnum("tier").notNull().default("free"),
  status: membershipStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  koFiTransactionId: text("kofi_transaction_id"),
  koFiEmail: text("kofi_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ReadingUsage = typeof readingUsage.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
