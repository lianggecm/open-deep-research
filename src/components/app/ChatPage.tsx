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
          // scroll to top of page
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 size-full pt-20 md:pt-5 px-5">
      <div className="flex flex-row gap-2 xl:px-4 items-start justify-center md:justify-end">
        <button
          onClick={() => {
            // copy to clipboard
            alert("Copied link to clipboard");
            navigator.clipboard.writeText(window.location.href);
          }}
          className="cursor-pointer flex flex-col justify-center items-center overflow-hidden gap-2.5 px-3 py-1.5 rounded border-[0.5px] border-[#cad5e2]"
          style={{ filter: "drop-shadow(0px 1px 5px rgba(0,0,0,0.15))" }}
        >
          <div className="flex justify-start items-center self-stretch relative gap-1.5">
            <img src="/share.svg" alt="" className="size-4" />
            <p className="flex-grow-0 flex-shrink-0 text-sm text-left text-[#62748e]">
              Share
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            alert("TODO - download as PDF");
            // download as PDF
            // window.open(`/api/pdf?url=${window.location.href}`, "_blank");
          }}
          className="cursor-pointer flex flex-col justify-center items-center overflow-hidden  gap-2.5 px-3 py-1.5 rounded bg-[#072d77] border border-[#072d77]"
        >
          <div className="flex justify-start items-center self-stretch relative gap-1.5">
            <img src="/download.svg" alt="" className="size-4" />
            <p className="flex-grow-0 flex-shrink-0 text-sm text-left text-white">
              Download as PDF
            </p>
          </div>
        </button>
      </div>

      {researchData.coverUrl && (
        <div className="w-full h-[202px] md:h-[305px] relative overflow-hidden rounded-lg border border-[#cad5e2]">
          <img
            src={researchData.coverUrl}
            className="w-full h-full object-cover rounded"
            alt=""
          />
        </div>
      )}
      <div className="flex flex-col-reverse xl:flex-row gap-6 ">
        <div className="max-w-[600px]">
          <CustomMarkdown>{researchData.report}</CustomMarkdown>
        </div>
      </div>
    </div>
  );
};
