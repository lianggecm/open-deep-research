import { auth } from "@clerk/nextjs/server";
import { getRemainingResearch } from "../../../../lib/limits";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { remaining, reset } = await getRemainingResearch({
    clerkUserId: userId,
  });

  return NextResponse.json({
    remaining,
    reset: reset ? new Date(reset).toISOString() : null,
  });
}
