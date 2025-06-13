import { auth } from "@clerk/nextjs/server";
import { getRemainingResearch } from "../../../../lib/limits";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  // get the API key from the request body
  const { isBringingKey } = await request.json();

  console.log("isBringingKey", isBringingKey);

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { remaining, reset } = await getRemainingResearch({
    clerkUserId: userId,
    isBringingKey: !!isBringingKey,
  });

  return NextResponse.json({
    remaining,
    reset: reset ? new Date(reset).toISOString() : null,
  });
}
