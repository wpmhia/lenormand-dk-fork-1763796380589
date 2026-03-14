import { pgTable, serial, text, date, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const readingUsage = pgTable("reading_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  count: integer("count").default(0).notNull(),
});

export const userSupporter = pgTable("user_supporter", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
});

export type ReadingUsage = typeof readingUsage.$inferSelect;
export type UserSupporter = typeof userSupporter.$inferSelect;
