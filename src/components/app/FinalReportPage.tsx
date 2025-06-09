"use client";
import { getResearch } from "@/db/action";
import { toast } from "sonner";

import { CustomMarkdown } from "../CustomMarkdown";
import { WebResultCard } from "./reportLoading/WebResultCard";

export const FinalReportPage = ({
  researchData,
}: {
  researchData: Awaited<ReturnType<typeof getResearch>>;
}) => {
  if (!researchData || !researchData.report) {
    return <></>;
  }

  console.log(researchData.sources?.map((source) => source.url));

  return (
    <div className="flex flex-col gap-5 size-full pt-20 md:pt-5 px-5">
      <div className="flex flex-row gap-2 xl:px-4 items-start justify-center md:justify-end">
        <button
          onClick={() => {
            // copy to clipboard
            toast.success("Copied to clipboard!");
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
            toast.success("PDF generation TODO!");
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
          {researchData.sources && researchData.sources?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <h3 className="text-lg font-medium text-[#101828] col-span-full mb-2">
                We found {researchData.sources.length} sources for this
                research:
              </h3>
              {researchData.sources.map((result, idx) => (
                <WebResultCard
                  key={result.url + "-" + idx}
                  result={result}
                  id={result.url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
