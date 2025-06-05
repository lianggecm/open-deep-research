"use client";

import { Heading } from "../Heading";
import { ReportSteps } from "./reportLoading/ReportSteps";

export const ReportLoadingPage = ({
  researchTopic,
}: {
  researchTopic: string;
}) => {
  return (
    <div className="px-5 py-5 h-full flex flex-col flex-1">
      <Heading
        title={researchTopic}
        description="It takes a few minutes to gather sources, analyze data, and create your report."
      />

      <ReportSteps />
    </div>
  );
};
