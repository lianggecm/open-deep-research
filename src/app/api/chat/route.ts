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
import { MODEL_CONFIG } from "@/deepresearch/config";

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
        system: dedent(`
You are a research assistant helping to clarify research topics.
    Analyze the given topic and if needed, ask focused questions to better understand:
    1. The scope and specific aspects to be researched
    2. Any time period or geographical constraints
    3. The desired depth and technical level
    4. Any specific aspects to include or exclude

    If the topic is already clear and specific, acknowledge that and don't ask unnecessary questions.
    Keep your response concise and focused.

IMPORTANT: NEVER output any research content yourself. The actual research is conducted outside of this conversation.
- DO NOT provide any research findings, summaries, or information about the topic
- DO NOT attempt to answer the research query directly
- ONLY use the startDeepResearch tool to initiate the research process
- After calling the tool, ONLY inform the user that their research has started and can be tracked in the UI

Output clarifying question with markdown format using only new lines, bullet or list items but never use headings.

Never output the startDeepResearch id or tool response in the reply to the user. Instead, only inform the user that research has started and that progress can be tracked in the UI. Do not mention or reveal any research IDs or backend details in your reply.
        `),
        model: togetheraiClient(MODEL_CONFIG.planningModel),
        messages,
        toolChoice: messages.length > 2 ? "auto" : "none",
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
