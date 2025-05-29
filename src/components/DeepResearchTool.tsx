"use client";

import { useEffect, useState } from "react";
import { ResearchEventStreamEvents } from "@/app/api/research/route";
import ResearchProgress from "./ResearchProgress";
interface DeepResearchToolProps {
  args: {
    topic: string;
  };
  result?: {
    researchId: string;
    status: string;
    createdAt: string;
  };
  onResearchEnd?: () => void;
}

export const DeepResearchTool = ({
  args,
  result,
  onResearchEnd,
}: DeepResearchToolProps) => {
  const [researchData, setResearchData] = useState<ResearchEventStreamEvents[]>(
    []
  );
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchResearch = async (researchId: string) => {
    try {
      const response = await fetch(`/api/research/?sessionId=${researchId}`);
      if (!response.ok) throw new Error("Failed to fetch research data");

      const data = await response.json();

      if (data.is_completed) {
        setIsStreaming(false);
        onResearchEnd && onResearchEnd();
      } else {
        if (!isStreaming) setIsStreaming(true);
      }

      // Update research data, maintaining chronological order
      setResearchData(
        data.events.sort((a: any, b: any) => a.timestamp - b.timestamp)
      );

      return data.is_completed;
    } catch (error) {
      console.error("Error fetching research:", error);
      setIsStreaming(false);
      return false;
    }
  };

  useEffect(() => {
    if (!result) return;

    let pollInterval: NodeJS.Timeout;
    let isPolling = true;

    const pollResearch = async () => {
      if (!isPolling) return;

      const isCompleted = await fetchResearch(result.researchId);

      if (!isCompleted && isPolling) {
        pollInterval = setTimeout(pollResearch, 2000);
      }
    };

    // Start polling
    pollResearch();

    // Cleanup function
    return () => {
      isPolling = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [result?.researchId]);

  return (
    <>
      <ResearchProgress
        events={researchData}
        isStreaming={isStreaming}
        researchTopic={args.topic}
      />
    </>
  );
};
