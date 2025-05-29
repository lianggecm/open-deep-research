import { db } from "@/db";
import { deepresearch } from "@/db/schema";
import { StartResearchPayload } from "@/deepresearch/workflows/start-research-workflow";
import { qstash, workflow } from "@/lib/clients";
import { nanoid } from "nanoid";

export const startResearch = async ({
  chatId,
  topic,
}: {
  chatId: string;
  topic: string;
}) => {
  // Get the base URL for the workflow
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const workflowUrl = `${baseUrl}/api/workflows/nested-research/start-research`;

  const sessionId = nanoid(10); // Generate a unique session ID for this research session

  const payload: StartResearchPayload = {
    topic,
    sessionId,
  };

  const { workflowRunId } = await workflow.trigger({
    url: workflowUrl,
    body: JSON.stringify(payload),
    retries: 3, // Optional retries for the initial request
  });

  // await qstash.publishJSON({
  //   url: "http://localhost:3000/api/cancel",
  //   body: {
  //     id: workflowRunId,
  //   },
  //   delay: 10,
  // });

  console.log("Started research with ID:", sessionId);

  if (!workflowRunId)
    throw new Error("No workflow run ID returned from Trigger");

  const [research] = await db
    .insert(deepresearch)
    .values({
      topic,
      chatId,
      id: sessionId,
      status: "pending",
    })
    .returning();

  return {
    researchId: research.id,
    status: research.status,
    createdAt: research.createdAt,
  };
};
