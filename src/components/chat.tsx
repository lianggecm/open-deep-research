"use client";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { Messages } from "./messages";
import { Footnote } from "./footnote";

import { ChatInput } from "./ChatInput";
import { UIMessage } from "ai";

export function Chat({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages?: UIMessage[];
}) {
  const { messages, append, status, stop, setMessages } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages,
    sendExtraMessageFields: true, // send id and createdAt for each message
    body: { chatId: chatId },
    experimental_prepareRequestBody: ({ messages }) => {
      const lastMessage = messages[messages.length - 1];
      return {
        chatId: chatId,
        message: lastMessage,
      };
    },
    onError: () => {
      toast.error("An error occurred, please try again!");
    },
  });

  const isGeneratingResponse = ["streaming", "submitted"].includes(status);

  return (
    <>
      {messages.length > 0 && (
        <Messages
          messages={messages}
          status={status}
          onResearchEnd={async () => {
            const res = await fetch(`/api/chat?chatId=${chatId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });
            const data = await res.json();
            setMessages(data);
          }}
        />
      )}

      <div className="flex flex-col gap-4 w-full fixed bottom-0 pb-4">
        {messages.length <= 3 && (
          <ChatInput
            isGeneratingResponse={isGeneratingResponse}
            append={append}
            stop={stop}
          />
        )}

        <Footnote />
      </div>
    </>
  );
}
