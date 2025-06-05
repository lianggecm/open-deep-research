"use server";

import { eq } from "drizzle-orm";
import { db } from "./index";
import { research } from "./schema";
import { redirect } from "next/navigation";

export const createResearch = async ({
  clerkUserId,
  initialUserMessage,
}: {
  clerkUserId?: string;
  initialUserMessage: string;
}) => {
  const [result] = await db
    .insert(research)
    .values({
      clerkUserId,
      initialUserMessage,
    })
    .returning();

  console.log("result", result);
  return result.id;
};

export const getResearches = async () => {
  const c = await db.select().from(research);
  return c;
};

export const getResearch = async (id: string) => {
  const result = await db
    .select()
    .from(research)
    .where(eq(research.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
};

export const deleteResearch = async (chatId: string) => {
  await db.delete(research).where(eq(research.id, chatId));
};

export async function createResearchAndRedirect({
  clerkUserId,
  initialUserMessage,
}: {
  clerkUserId?: string;
  initialUserMessage: string;
}) {
  const id = await createResearch({
    clerkUserId,
    initialUserMessage,
  });
  redirect(`/chat/${id}`);
}
