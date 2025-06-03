"use server";

import { eq } from "drizzle-orm";
import { db } from "./index";
import { chats, deepresearch } from "./schema";
import { redirect } from "next/navigation";

export const createChat = async ({
  clerkUserId,
  initialUserMessage,
}: {
  clerkUserId?: string;
  initialUserMessage: string;
}) => {
  const [result] = await db
    .insert(chats)
    .values({
      clerkUserId,
      initialUserMessage,
    })
    .returning();
  return result.id;
};

export const getChats = async () => {
  const c = await db.select().from(chats);
  return c;
};

export const deleteChat = async (chatId: string) => {
  await db.delete(chats).where(eq(chats.id, chatId));
};

export async function createNewChat({
  clerkUserId,
  initialUserMessage,
}: {
  clerkUserId?: string;
  initialUserMessage: string;
}) {
  const id = await createChat({
    clerkUserId,
    initialUserMessage,
  });
  redirect(`/chat/${id}`);
}

export const getDeepresearch = async (id: string) => {
  const result = await db
    .select()
    .from(deepresearch)
    .where(eq(deepresearch.id, id))
    .limit(1);

  return result[0] || null;
};
