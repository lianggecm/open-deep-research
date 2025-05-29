"use client";
import { Chat } from "@/components/chat";
import { ChatInput } from "@/components/ChatInput";
import { Footnote } from "@/components/footnote";
import { createNewChat } from "@/db/action";
import { useSearchParams } from "next/navigation";

export const LandingHomepage = () => {
  return (
    <div className="flex flex-col size-full items-center h-screen justify-center">
      <div className="px-4 md:px-0 pb-4 pt-8 flex flex-col items-center w-full max-w-3xl justify-center gap-4">
        <div className="flex flex-col gap-4 w-full mb-14">
          <p className="text-[32px] font-medium text-center text-[#1e2939]">
            Reports with DeepSeek
          </p>
          <p className="mx-auto max-w-[364px] text-base text-center text-[#6a7282]">
            Have AI do research for you, refine your ideas, and turn every
            question into a meaningful report
          </p>
        </div>
        <ChatInput
          append={(message) => {
            localStorage.setItem("firstMessage", message.content);
            createNewChat();
          }}
          stop={() => {
            console.log("stop");
          }}
          isGeneratingResponse={false}
        />

        <Footnote />
      </div>
    </div>
  );
};
