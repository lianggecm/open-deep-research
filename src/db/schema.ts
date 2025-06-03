import {
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
);

export const chats = pgTable("chats", {
  id: varchar()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  clerkUserId: varchar(),
  initialUserMessage: varchar().notNull(),
  questions: jsonb().$type<string[]>(),
  answers: jsonb().$type<string[]>(),
  researchTopic: varchar(),

  createdAt: timestamp().defaultNow().notNull(),
});

export const deepresearchStautsEnum = pgEnum("status", [
  "pending",
  "processing",
  "completed",
]);

export const deepresearch = pgTable("deepresearch", {
  id: varchar()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  createdAt: timestamp().defaultNow().notNull(),
  status: deepresearchStautsEnum().notNull(),
  topic: varchar().notNull(),
  report: varchar(),
  coverUrl: varchar(),
  chatId: varchar()
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
});
