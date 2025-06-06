"use client";
import { ChatInput } from "@/components/ChatInput";
import { Footer } from "@/components/Footer";
import { createResearchAndRedirect } from "@/db/action";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import LoadingChat from "./chat/[chatId]/loading";

export const LandingHomepage = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) return <LoadingChat />;

  return (
    <div className="flex flex-col size-full items-center h-screen justify-center relative md:bg-[url('/bg.svg')] md:bg-no-repeat md:bg-center md:bg-[size:auto_100%]">
      <div className="px-4 pb-4 pt-8 flex flex-col items-center w-full max-w-3xl justify-center gap-4">
        <a
          href="https://togetherai.link/"
          target="_blank"
          rel="noreferrer"
          className="w-[180px] relative items-center justify-center rounded bg-gray-50 border border-gray-200 flex flex-row gap-1 px-4 py-2"
        >
          <div className="text-xs text-[#6A7282] whitespace-nowrap">
            Powered by
          </div>
          <img
            src="/together.png"
            className="w-[77.3px] h-[12.94px] mt-0.5 object-fill"
            alt="Together.ai logo"
          />
        </a>

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
          disabled={!isLoaded || isLoading}
          append={(message) => {
            setTimeout(() => {
              setIsLoading(true);
            }, 400);
            createResearchAndRedirect({
              clerkUserId: isSignedIn ? user.id : undefined,
              initialUserMessage: message.content,
            });
          }}
          stop={() => {}}
          isGeneratingResponse={false}
        />

        <Footer />
      </div>
    </div>
  );
};
