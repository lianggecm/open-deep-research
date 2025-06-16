"use client";
import { getResearch } from "@/db/action";
import { useRouter } from "next/navigation";

import { QuestionsPage } from "@/components/app/questions/QuestionsPage";
import { ReportLoadingPage } from "./ReportLoadingPage";
import { FinalReportPage } from "./FinalReportPage";

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
      <QuestionsPage questions={researchData.questions || []} chatId={chatId} />
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
          // scroll to top of page
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return <FinalReportPage researchData={researchData} />;
};
