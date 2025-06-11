"use client";
import React from "react";

import { CustomMarkdown } from "../CustomMarkdown";
import { WebResultCard } from "./reportLoading/WebResultCard";
import { CitationNumber } from "./citations/CitationNumber";
import { extractMarkdownHeadings } from "@/lib/utils";
import { TableOfContents } from "./TableOfContents";

export const ReportBody = ({
  researchData,
}: {
  researchData: {
    researchTopic: string | null;
    report: string | null;
    sources?: Array<{ url: string; title: string }> | null;
    coverUrl: string | null;
    citations?: Array<{
      url: string;
      title: string;
      citation: string;
    }> | null;
  };
}) => {
  if (!researchData || !researchData.report) {
    return <></>;
  }

  return (
    <div className="border border-[#E2E8F0] rounded-lg pb-4 mb-6">
      {researchData.coverUrl && (
        <div className="w-full h-[202px] md:h-[305px] relative overflow-hidden rounded-lg">
          <img
            src={researchData.coverUrl}
            className="w-full h-full object-cover rounded"
            alt=""
          />
        </div>
      )}
      <div className="flex flex-col-reverse xl:flex-row gap-6 px-5 pt-3">
        {/* Main Content */}
        <div className="max-w-[600px]">
          <CustomMarkdown sources={researchData.sources || []}>
            {researchData.report}
          </CustomMarkdown>
          {researchData.sources && researchData.sources?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <h3 className="text-lg font-medium text-[#101828] col-span-full mb-2">
                We used {researchData.sources.length} sources for this research:
              </h3>
              {researchData.sources.map((result, idx) => (
                <WebResultCard
                  key={result.url + "-" + idx}
                  result={result}
                  id={result.url}
                >
                  <CitationNumber num={idx + 1} />
                </WebResultCard>
              ))}
            </div>
          )}
        </div>

        {/* Table of Contents */}
        <TableOfContents markdown={researchData.report || ""} />
      </div>
    </div>
  );
};
