import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { research } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const chats = await db
    .select({
      id: research.id,
      topic: research.initialUserMessage,
    })
    .from(research)
    .orderBy(desc(research.createdAt))
    .where(eq(research.clerkUserId, userId));

  return NextResponse.json(chats);
}
