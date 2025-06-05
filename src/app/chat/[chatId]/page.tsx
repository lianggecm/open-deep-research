import { db } from "@/db";
import { eq } from "drizzle-orm";
import { research } from "@/db/schema";
import { Metadata } from "next";
import { getResearch } from "@/db/action";
import { redirect } from "next/navigation";
import { generateObject, generateText } from "ai";
import { MODEL_CONFIG, PROMPTS } from "@/deepresearch/config";
import dedent from "dedent";
import { togetheraiClient } from "@/deepresearch/apiClients";
import z from "zod";
import { ChatPage } from "@/components/app/ChatPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chatId: string }>;
}): Promise<Metadata> {
  const { chatId } = await params;

  if (!chatId) {
    return {
      title: "Chat Not Found | DeepSeek Research",
      description: "This chat could not be found on DeepSeek Research",
    };
  }

  const researchData = chatId ? await getResearch(chatId) : undefined;

  if (!researchData) {
    return redirect("/");
  }

  const topic = researchData.researchTopic || researchData.initialUserMessage;

  const title = `${topic} | DeepSeek Research`;
  const description = `Discover the research on "${topic}" ${researchData.status} | DeepSeek Research`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: researchData.coverUrl ? [researchData.coverUrl] : [],
    },
  };
}

export default async function Page(props: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await props.params; // get the chat ID from the URL
  const researchData = await getResearch(chatId); // load the chat

  console.log("researchData", researchData, "chatId", chatId);

  // if we get chat without questions, generate questions with AI LLM and save to DB
  if (!researchData || !researchData.initialUserMessage) {
    return redirect("/");
  }

  if (!researchData.questions) {
    console.log("Generating questions...");
    const questionsText = await generateText({
      system: dedent(PROMPTS.clarificationPrompt),
      messages: [
        {
          role: "user",
          content: researchData.initialUserMessage,
        },
      ],
      model: togetheraiClient(MODEL_CONFIG.planningModel),
    });
    const result = await generateObject({
      system: dedent(PROMPTS.clarificationParsingPrompt),
      model: togetheraiClient(MODEL_CONFIG.jsonModel),
      messages: [
        {
          role: "user",
          content: questionsText.text,
        },
      ],
      schema: z.object({
        questions: z.array(z.string()),
      }),
    });

    await db
      .update(research)
      .set({
        questions: result.object.questions,
      })
      .where(eq(research.id, researchData.id));
  }

  return <ChatPage chatId={chatId} researchData={researchData} />;
}
