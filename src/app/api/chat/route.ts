import { togetheraiClient } from "@/deepresearch/apiClients";
import dedent from "dedent";
import {
  streamText,
  UIMessage,
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  tool,
} from "ai";
import { NextRequest } from "next/server";
import { loadChat, upsertMessage } from "@/db/action";
import { startResearch } from "@/deepresearch/startResearch";
import z from "zod";
import { MODEL_CONFIG, PROMPTS } from "@/deepresearch/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) {
    return new Response("Missing chatId", { status: 400 });
  }
  const messages = await loadChat(chatId);

  return new Response(JSON.stringify(messages), { status: 200 });
}

export async function POST(request: NextRequest) {
  const { chatId, message }: { chatId: string; message: UIMessage } =
    await request.json();

  // create or update last message in database
  await upsertMessage({ chatId, id: message.id, message });

  // load the previous messages from the server:
  const previousMessages = await loadChat(chatId);

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: previousMessages.map((m) => ({ ...m, content: "" } as UIMessage)),
    message,
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        system: dedent(PROMPTS.clarificationPrompt),
        model: togetheraiClient(MODEL_CONFIG.planningModel),
        messages,
        toolChoice: messages.length > 2 ? "required" : "none",
        // toolCallStreaming: true,
        maxSteps: 5,
        tools: {
          startDeepResearch: tool({
            description: "Start a deep research on a topic",
            parameters: z.object({
              topic: z.string().describe("The topic to research"),
            }),
            execute: async ({ topic }) => {
              return await startResearch({
                chatId,
                topic,
              });
            },
          }),
        },
        async onFinish({ response }) {
          const newMessage = appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }).at(-1)!;

          await upsertMessage({
            id: newMessage.id,
            chatId: chatId,
            message: newMessage as UIMessage,
          });
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      console.error("onError", error);
      return error instanceof Error ? error.message : String(error);
    },
  });
}
