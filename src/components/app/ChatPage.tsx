"use client";
import { getResearch, skipQuestions, storeAnswers } from "@/db/action";
import { useRouter } from "next/navigation";

import { QuestionsPage } from "@/components/app/questions/QuestionsPage";
import { ReportLoadingPage } from "./ReportLoadingPage";

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
      />
    );
  }

  return <div className="flex flex-col size-full items-center">CIAO</div>;
};
