"use client";

import { useEffect, useState } from "react";
import { Heading } from "../Heading";
import { ReportSteps } from "./reportLoading/ReportSteps";
import TimelineProgress from "./reportLoading/TimelineProgress";
import { ResearchEventStreamEvents } from "@/app/api/research/route";

export const ReportLoadingPage = ({
  researchTopic,
  chatId,
}: {
  researchTopic: string;
  chatId: string;
}) => {
  const [researchData, setResearchData] = useState<ResearchEventStreamEvents[]>(
    []
  );
  const [isStreaming, setIsStreaming] = useState(false);

  const onResearchEnd = () => {
    setIsStreaming(false);
    // Additional logic after research is completed
  };

  const fetchResearch = async (researchId: string) => {
    try {
      const response = await fetch(`/api/research/?sessionId=${researchId}`);
      if (!response.ok) throw new Error("Failed to fetch research data");

      const events: ResearchEventStreamEvents[] = await response.json();

      const isCompleted =
        events.some((event) => event.type === "research_completed") ||
        events.some(
          (event) =>
            event.type === "research_status" && event.status === "completed"
        );

      if (isCompleted) {
        onResearchEnd();
      } else {
        if (!isStreaming) setIsStreaming(true);
      }

      // Update research data, maintaining chronological order
      setResearchData(
        events.sort((a: any, b: any) => a.timestamp - b.timestamp)
      );
      return { isCompleted: isCompleted };
    } catch (error) {
      console.error("Error fetching research:", error);
      setIsStreaming(false);
      return { isCompleted: true };
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let isPolling = true;

    const pollResearch = async () => {
      if (!isPolling) return;

      const { isCompleted } = await fetchResearch(chatId);

      if (!isCompleted && isPolling) {
        pollInterval = setTimeout(pollResearch, 4000);
      }
    };

    // Start polling
    pollResearch();

    // Cleanup function
    return () => {
      isPolling = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, []);

  return (
    <div className="px-5 py-5 h-full flex flex-col flex-1">
      <Heading
        title={researchTopic}
        description="It takes a few minutes to gather sources, analyze data, and create your report."
      />

      <div className="flex flex-col gap-2 md:flex-row">
        <ReportSteps onCancel={() => {}} />

        <TimelineProgress />
      </div>
    </div>
  );
};
