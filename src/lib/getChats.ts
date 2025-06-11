import { db } from "@/db";
import { research } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getChats(userId: string) {
  return db
    .select({
      id: research.id,
      title: research.title,
      initialUserMessage: research.initialUserMessage,
      researchTopic: research.researchTopic,
      completedAt: research.completedAt,
      createdAt: research.createdAt,
    })
    .from(research)
    .orderBy(desc(research.createdAt), desc(research.completedAt))
    .where(eq(research.clerkUserId, userId));
}
