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

export const deepresearchStautsEnum = pgEnum("status", [
  "questions",
  "pending",
  "processing",
  "completed",
]);

export const research = pgTable("chats", {
  id: varchar()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  clerkUserId: varchar(),
  // message prompt from the user in landing page
  initialUserMessage: varchar().notNull(),
  // generated questions based on the user prompt
  questions: jsonb().$type<string[]>(),
  // answers given from the user or empty array if skipped
  answers: jsonb().$type<string[]>(),
  // research topic
  researchTopic: varchar(),

  researchStartedAt: timestamp(),
  status: deepresearchStautsEnum().notNull().default("questions"),
  report: varchar(), // markdown of the report
  coverUrl: varchar(), // url of the cover image generated with flux

  createdAt: timestamp().defaultNow().notNull(),
});
