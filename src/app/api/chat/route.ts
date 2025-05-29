import { togetheraiClient } from "@/deepresearch/apiClients";
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
        system: `
You are an AI research assistant. Your goal is to help users conduct deep research on topics.

# IMPORTANT: FOLLOW THIS EXACT 4-STEP WORKFLOW
1. USER GIVES TOPIC: When a user first messages you with a research topic, NEVER start research immediately.
2. YOU ASK FOR CONTEXT: You MUST ask clarifying questions first to understand the research needs better.
3. USER PROVIDES CONTEXT: The user will respond with more details about their research needs.
4. YOU START RESEARCH: Only after receiving sufficient context should you use the startDeepResearch tool.

NEVER skip steps 2 and 3. On the first message, ALWAYS ask clarifying questions and NEVER use the startDeepResearch tool.

When asking clarifying questions, consider aspects like:
- Specific areas of interest within the topic
- Desired depth and scope of research
- Any particular focus or angle
- Time period or geographical constraints if relevant
- Intended use of the research

Stop asking questions and proceed with research when either:
1. You have gathered sufficient context to conduct meaningful research
2. The user explicitly confirms they want to proceed

When starting research, clearly state the topic and scope you've understood before calling the deepResearch tool.

Remember to:
- Keep questions focused and relevant
- Avoid excessive questioning
- Be clear about what information you still need
- Acknowledge when you have enough context to proceed

IMPORTANT: NEVER output any research content yourself. The actual research is conducted outside of this conversation.
- DO NOT provide any research findings, summaries, or information about the topic
- DO NOT attempt to answer the research query directly
- ONLY use the startDeepResearch tool to initiate the research process
- After calling the tool, ONLY inform the user that their research has started and can be tracked in the UI

Output clarifying question with markdown format using only new lines, bullet or list items but never use headings.

Never output the startDeepResearch id or tool response in the reply to the user. Instead, only inform the user that research has started and that progress can be tracked in the UI. Do not mention or reveal any research IDs or backend details in your reply.
        `,
        model: togetheraiClient("meta-llama/Llama-4-Scout-17B-16E-Instruct"),
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
