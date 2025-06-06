import { db } from "@/db";
import { research } from "@/db/schema";
import { workflow } from "@/lib/clients";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { cleanupSession } from "@/deepresearch/storage";

export async function POST(request: NextRequest) {
  const { chatId } = await request.json();
  console.log("cancel workflow with run ID: ", chatId);

  // delete this from the db
  await db.delete(research).where(eq(research.id, chatId));

  // also delete from redis
  await cleanupSession(chatId);

  await workflow.cancel({
    ids: chatId,
  });

  return new Response("canceled workflow run!");
}
