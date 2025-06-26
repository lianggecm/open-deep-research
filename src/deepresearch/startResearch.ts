"use server";
import { db } from "@/db";
import { getResearch } from "@/db/action";
import { research } from "@/db/schema";
// import { StartResearchPayload } from "@/deepresearch/workflows/start-research-workflow"; // No longer needed
// import { qstash, workflow } from "@/lib/clients"; // No longer using Upstash Workflow or qstash for this
import { eq } from "drizzle-orm";
import { limitResearch } from "@/lib/limits";
import { spawn } from "child_process";
import path from "path";

export const startResearch = async ({
  chatId,
  personalTogetherApiKey,
}: {
  chatId: string;
  personalTogetherApiKey?: string;
}) => {
  console.log("startResearch called for chatId:", chatId);

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

  // Update research status in DB
  const updatedResearch = await db
    .update(research)
    .set({
      researchTopic,
      researchStartedAt: new Date(),
      status: "processing", // Explicitly set status to processing
    })
    .where(eq(research.id, chatId))
    .returning();

  console.log(
    `Research topic for chatId ${chatId}: "${researchTopic}"`
  );

  // Define arguments for the Python script
  const pythonScriptPath = path.join(process.cwd(), "src", "adk_deep_research", "main_agent.py");
  const args = [
    pythonScriptPath,
    "--session_id", chatId,
    "--topic", researchTopic,
  ];

  if (personalTogetherApiKey) {
    args.push("--together_api_key", personalTogetherApiKey);
  }

  console.log("Spawning Python ADK agent with args:", args);

  // Spawn the Python script
  // Ensure Python executable is in PATH or provide full path.
  // Common names: 'python', 'python3'
  // Consider making the python executable path configurable via environment variable.
  const pythonExecutable = process.env.PYTHON_EXECUTABLE || "python3";
  const adkProcess = spawn(pythonExecutable, args, {
    stdio: "pipe", // Pipe stdout and stderr to Node.js
    // cwd: process.cwd(), // Optional: set current working directory if script relies on it
  });

  adkProcess.stdout.on("data", (data) => {
    console.log(`ADK Agent (stdout) for ${chatId}: ${data.toString().trim()}`);
  });

  adkProcess.stderr.on("data", (data) => {
    console.error(`ADK Agent (stderr) for ${chatId}: ${data.toString().trim()}`);
  });

  adkProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`ADK Agent for ${chatId} exited with code ${code}`);
      // Optionally, update research status to 'error' in DB here
      // db.update(research).set({ status: "error", report: `Agent exited with code ${code}`}).where(eq(research.id, chatId)).execute();
    } else {
      console.log(`ADK Agent for ${chatId} completed successfully.`);
      // The Python script itself should update the DB to 'completed' status.
    }
  });

  adkProcess.on("error", (err) => {
    console.error(`Failed to start ADK Agent for ${chatId}:`, err);
    // Optionally, update research status to 'error' in DB here
    // db.update(research).set({ status: "error", report: `Failed to start agent: ${err.message}`}).where(eq(research.id, chatId)).execute();
    throw new Error(`Failed to start ADK research agent: ${err.message}`);
  });

  // Since the Python script runs asynchronously and updates Redis/DB itself,
  // this function now primarily serves to kick off the process.
  // The original return value might need adjustment as workflowRunId is gone.
  console.log(
    "ADK research process started for ID:",
    chatId + " 🔎:" + researchTopic
  );

  // Return relevant info. Status is now 'processing' as set above.
  return {
    researchId: updatedResearch[0].id,
    status: updatedResearch[0].status,
    createdAt: updatedResearch[0].createdAt,
  };
};
