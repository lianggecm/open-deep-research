"use server";
import { db } from "@/db";
import { getResearch } from "@/db/action";
import { research } from "@/db/schema";
import { StartResearchPayload } from "@/deepresearch/workflows/start-research-workflow";
import { workflow } from "@/lib/clients";
import { eq } from "drizzle-orm";
import { getRemainingResearch } from "@/lib/limits";

export const startResearch = async ({
  chatId,
  togetherApiKey,
}: {
  chatId: string;
  togetherApiKey?: string;
}) => {
  console.log("startResearch", chatId);

  const researchData = await getResearch(chatId);

  if (!researchData || !researchData.clerkUserId) {
    throw new Error("Research with clerk user not found");
  }

  const { remaining } = await getRemainingResearch({
    clerkUserId: researchData?.clerkUserId,
  });

  if (remaining <= 0) {
    throw new Error("No remaining researches");
  }

  // Get the base URL for the workflow
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const workflowUrl = `${baseUrl}/api/workflows/nested-research/start-research`;

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

  const payload: StartResearchPayload = {
    topic: researchTopic,
    sessionId: chatId,
    togetherApiKey,
  };

  // generate researchTopic by joining strings with:initialUserMessage + questions+answers the complete researchTopic to use in the research

  const { workflowRunId } = await workflow.trigger({
    url: workflowUrl,
    body: JSON.stringify(payload),
    retries: 3, // Optional retries for the initial request
  });

  // await qstash.publishJSON({
  //   url: "http://localhost:3000/api/cancel",
  //   body: { id: workflowRunId, },
  //   delay: 10,
  // });

  console.log(
    "Started research with ID:",
    chatId + " WfId:" + workflowRunId + " 🔎:" + researchTopic
  );

  if (!workflowRunId)
    throw new Error("No workflow run ID returned from Trigger");

  return {
    researchId: research.id,
    status: research.status,
    createdAt: research.createdAt,
  };
};
