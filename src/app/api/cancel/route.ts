import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { research } from "@/db/schema";
import { workflow } from "@/lib/clients";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { cleanupSession } from "@/deepresearch/storage";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { chatId } = await request.json();
  console.log("cancel workflow with run ID: ", chatId);

  const [researchEntry] = await db
    .select()
    .from(research)
    .where(eq(research.id, chatId))
    .limit(1);

  if (!researchEntry || researchEntry.clerkUserId !== userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // delete this from the db
  await db.delete(research).where(eq(research.id, chatId));

  // also delete from redis
  await cleanupSession(chatId);

  try {
    await workflow.cancel({
      ids: chatId,
    });
  } catch (e) {
    console.error("failed to cancel workflow run", e);
  }
  return new Response("canceled workflow run!");
}
