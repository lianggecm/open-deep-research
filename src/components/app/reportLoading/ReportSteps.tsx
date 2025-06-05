import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReportStepType = {
  id: string;
  title: string;
  status: "pending" | "completed" | "loading";
};

export const ReportSteps = ({
  chatId,
  researchStartedAt,
  steps,
}: {
  chatId: string;
  researchStartedAt: Date;
  steps: ReportStepType[];
}) => {
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);

  const onCancel = async () => {
    setIsCanceling(true);
    await fetch("/api/research/cancel", {
      method: "POST",
      body: JSON.stringify({ chatId: chatId }),
    });
    router.replace("/");
    setIsCanceling(false);
  };

  return (
    <div className="flex flex-col relative overflow-hidden rounded-lg bg-white border-[0.7px] border-[#d1d5dc] md:min-w-[206px] h-fit">
      <div className="flex-shrink-0 h-[68px] p-4 flex flex-col justify-center border-b-[0.7px] border-[#d1d5dc]">
        <p className="text-base font-medium text-left text-[#101828]">
          Generating Report
        </p>
        <p className="text-xs text-left text-[#6a7282]">
          <span className="text-sm font-light text-left text-[#6a7282]">
            Time elapsed:
          </span>
          <span className="text-sm text-left text-[#6a7282] ml-1">
            {formatDistanceToNow(researchStartedAt, { addSuffix: true })}
          </span>
        </p>
      </div>
      <div className="flex flex-col px-2 py-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-2 px-2 py-2.5 rounded"
          >
            <img
              src={
                step.status === "completed"
                  ? "/reportStep/completed.svg"
                  : step.status === "loading"
                  ? "/reportStep/loading.svg"
                  : "/reportStep/pending.svg"
              }
              className={cn(
                "size-3",
                step.status === "loading" ? "animate-spin" : ""
              )}
              alt={`${step.status} icon`}
            />
            <p
              className={`text-sm text-left ${
                step.status === "pending" ? "text-[#d1d5dc]" : ""
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>

      <button
        disabled={isCanceling}
        onClick={onCancel}
        className="px-4 py-3 text-sm font-light text-left text-[#826a6a] cursor-pointer"
      >
        {isCanceling ? (
          <>
            <img src="loading.svg" className="size-5" />
          </>
        ) : (
          <>Cancel search</>
        )}
      </button>
    </div>
  );
};
