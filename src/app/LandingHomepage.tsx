"use client";
import { ChatInput } from "@/components/ChatInput";
import { Footnote } from "@/components/Footnote";
import { createResearchAndRedirect } from "@/db/action";
import { useUser } from "@clerk/nextjs";

export const LandingHomepage = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="flex flex-col size-full items-center h-screen justify-center">
      <div className="px-4 md:px-0 pb-4 pt-8 flex flex-col items-center w-full max-w-3xl justify-center gap-4">
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
            className="min-w-[77.3px] h-fit mt-0.5"
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
          disabled={!isLoaded}
          append={(message) => {
            createResearchAndRedirect({
              clerkUserId: isSignedIn ? user.id : undefined,
              initialUserMessage: message.content,
            });
          }}
          stop={() => {}}
          isGeneratingResponse={false}
        />

        <Footnote />
      </div>
    </div>
  );
};
