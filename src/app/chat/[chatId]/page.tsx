import { Chat } from "@/components/chat";
import { db } from "@/db";
import { eq, desc } from "drizzle-orm";
import { loadChat } from "@/db/action";
import { deepresearch } from "@/db/schema";
import { Metadata } from "next";

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

  const messages = chatId ? await loadChat(chatId) : []; // load the chat messages

  const researches = chatId
    ? await db
        .select()
        .from(deepresearch)
        .where(eq(deepresearch.chatId, chatId))

        .orderBy(desc(deepresearch.createdAt))
        .limit(1)
    : null;

  const research = researches && researches.length >= 1 ? researches[0] : null;

  if (!research) {
    if (!messages || messages.length === 0) {
      return {};
    }

    const firstUserMessage = messages.find(
      (message) => message.role === "user"
    );
    const textMessage =
      firstUserMessage?.parts[0].type === "text"
        ? firstUserMessage.parts[0].text
        : "";

    const title = `Chat on "${textMessage.slice(0, 50)}" | DeepSeek Research`;
    const description = `${textMessage}`;

    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
      },
    };
  }

  const title = `${research.topic} | DeepSeek Research`;
  const description = `Discover the research on "${research.topic}" ${research.status} | DeepSeek Research`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: research.coverUrl ? [research.coverUrl] : [],
    },
  };
}

export default async function Page(props: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await props.params; // get the chat ID from the URL
  const messages = await loadChat(chatId); // load the chat messages

  // TODO fix any of messages
  return (
    <div className="flex flex-col size-full items-center">
      <div className="px-4 md:px-0 pb-[160px] pt-8 flex flex-col min-h-dvh items-center w-full max-w-3xl justify-between">
        <Chat chatId={chatId} initialMessages={messages as any} />
      </div>
    </div>
  );
}
