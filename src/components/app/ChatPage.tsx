"use client";
import { getResearch, skipQuestions, storeAnswers } from "@/db/action";
import { useRouter } from "next/navigation";

import { QuestionsPage } from "@/components/app/questions/QuestionsPage";
import { ReportLoadingPage } from "./ReportLoadingPage";
import { CustomMarkdown } from "../CustomMarkdown";

export const ChatPage = ({
  chatId,
  researchData,
}: {
  chatId: string;
  researchData: Awaited<ReturnType<typeof getResearch>>;
}) => {
  const router = useRouter();

  // if we get chat without questions, generate questions with AI LLM and save to DB
  if (!researchData || !researchData.initialUserMessage) {
    router.replace("/");
    return <></>;
  }

  if (!researchData.answers) {
    return (
      <QuestionsPage
        questions={researchData.questions || []}
        onSkip={() => {
          skipQuestions(chatId);
          router.refresh();
        }}
        onGenerate={(answers) => {
          storeAnswers(chatId, answers);
          router.refresh();
        }}
      />
    );
  }

  if (!researchData?.report) {
    return (
      <ReportLoadingPage
        researchTopic={researchData.initialUserMessage}
        chatId={chatId}
        researchStartedAt={
          researchData.researchStartedAt || researchData.createdAt
        }
        onComplete={() => {
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col size-full pt-20 px-5">
      {researchData.coverUrl && (
        <div className="w-full h-[202px] md:h-[305px] relative overflow-hidden rounded-lg border border-[#cad5e2]">
          <img
            src={researchData.coverUrl}
            className="w-full h-full object-cover rounded"
            alt=""
          />
        </div>
      )}
      <CustomMarkdown>{researchData.report}</CustomMarkdown>
    </div>
  );
};
