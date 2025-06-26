"use server";
import { db } from "@/db";
import { getResearch } from "@/db/action";
import { research } from "@/db/schema";
import { StartResearchPayload } from "@/deepresearch/workflows/start-research-workflow";
import { qstash, workflow } from "@/lib/clients";
import { eq } from "drizzle-orm";
import { limitResearch } from "@/lib/limits";

export const startResearch = async ({
  chatId,
  personalTogetherApiKey,
}: {
  chatId: string;
  personalTogetherApiKey?: string;
}) => {
  console.log("startResearch", chatId);

  const researchData = await getResearch(chatId);

  if (!researchData || !researchData.clerkUserId) {
    throw new Error("Research with clerk user not found");
  }

  const { success } = await limitResearch({
    clerkUserId: researchData?.clerkUserId,
    isBringingKey: !!personalTogetherApiKey,
  });

  if (!success) {
    throw new Error("No remaining researches");
  }

  // Get the base URL for the workflow
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const researchTopic = `${researchData?.initialUserMessage} ${
    researchData?.answers && researchData?.answers?.length > 0
      ? researchData?.questions
          ?.map((question, questionIdx) => {
            const answer = researchData?.answers?.[questionIdx];
            return answer ? `${questionIdx + 1}. ${question} ${answer}` : "";
          })
          .filter(Boolean)
          .join(" ")
      : ""
  }`.trim();

  await db
    .update(research)
    .set({
      researchTopic,
      researchStartedAt: new Date(),
    })
    .where(eq(research.id, chatId))
    .returning();

  const payload: StartResearchPayload = { // This type can be reused
    topic: researchTopic,
    sessionId: chatId,
    togetherApiKey: personalTogetherApiKey,
  };

  // New: Call the ADK research initiation API route
  const adkApiRoute = `${baseUrl}/api/adk-research/start`;
  console.log(`Calling ADK Research API: ${adkApiRoute} for session ${chatId}`);

  try {
    const response = await fetch(adkApiRoute, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to trigger ADK research, unknown error structure." }));
      console.error(`Error triggering ADK research for session ${chatId}. Status: ${response.status}`, errorData);
      throw new Error(errorData.error || `Failed to trigger ADK research. Status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log(`ADK Research initiated for session ${chatId}:`, responseData);

    // The concept of a `workflowRunId` from Upstash is gone.
    // The `sessionId` (which is `chatId`) is the primary identifier.
    // The qstash cancellation logic might need to be re-evaluated or removed if not applicable
    // to the Python child process. For now, let's comment out the qstash part.
    // If a timeout/cancellation is still needed for the Python process, it would require a different mechanism.

    // console.log(
    //   "Started ADK research with ID:",
    //   chatId + " 🔎:" + researchTopic
    // );

  } catch (error) {
    console.error(`Failed to call ADK research API for session ${chatId}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while trying to start ADK research.");
  }

  return {
    researchId: research.id, // This refers to the schema's research.id, which is chatId
    status: research.status,
    createdAt: research.createdAt,
  };
};
