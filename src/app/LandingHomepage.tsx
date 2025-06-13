"use client";
import { ChatInput } from "@/components/ChatInput";
import { Footer } from "@/components/Footer";
import { createResearchAndRedirect } from "@/db/action";
import { SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import LoadingChat from "./chat/[chatId]/loading";
import { Button } from "@/components/ui/button";
import { useTogetherApiKey } from "@/components/app/AppSidebar";
import { LandingHero } from "@/components/LandingHero";

export const LandingHomepage = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) return <LoadingChat />;

  return (
    <div className="flex flex-col size-full items-center h-screen justify-center relative md:bg-[url('/bg.svg')] md:bg-no-repeat md:bg-center md:bg-[size:auto_100%]">
      <div className="px-4 pb-4 pt-8 flex flex-col items-center w-full max-w-3xl justify-center gap-4">
        <LandingHero />

        {!isLoaded ? (
          <div className="h-[66px] w-full" />
        ) : !isSignedIn ? (
          <SignedOut>
            <div className="flex flex-col gap-2">
              <SignInButton>
                <div className="flex justify-center items-center relative gap-1.5 px-5 py-2 rounded bg-[#072d77] border-[0.5px] border-[#072d77] cursor-pointer">
                  <p className="flex-grow-0 flex-shrink-0 text-base font-medium text-left text-white">
                    Generate a report
                  </p>
                </div>
              </SignInButton>
              <p className="text-xs text-center text-[#99a1af]">
                No credit cards!
              </p>
            </div>
          </SignedOut>
        ) : (
          <ChatInput
            disabled={!isLoaded || isLoading}
            append={(message) => {
              setIsLoading(true);
              createResearchAndRedirect({
                clerkUserId: isSignedIn ? user.id : undefined,
                initialUserMessage: message.content,
              });
            }}
          />
        )}

        <Footer />
      </div>
    </div>
  );
};
