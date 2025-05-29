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

  const streamResearch = (researchId: string, onData: (data: any) => void) => {
    const eventSource = new EventSource(
      `/api/research/?sessionId=${researchId}`
    );
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (
        data.task_status === "completed" ||
        data.type === "research_completed" ||
        (data.type === "research_status" && data.row.status === "completed")
      ) {
        console.log("Research completed", data);
        eventSource.close();
        setIsStreaming(false);
        onResearchEnd && onResearchEnd();
      } else if (data.row) {
        if (!isStreaming) setIsStreaming(true);
        onData(data.row);
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  };

  useEffect(() => {
    if (!result) return;
    const cleanup = streamResearch(result.researchId, (data) => {
      if (data) {
        setResearchData((prevData) => {
          // Sort by timestamp to maintain chronological order
          const newData = [...prevData, data];
          return newData.sort((a, b) => a.timestamp - b.timestamp);
        });
      }
    });
    return cleanup;
  }, [result?.researchId]);

  return (
    <>
      {isStreaming ? "Streaming research..." : "Not stream!"}
      <ResearchProgress events={researchData} isStreaming={isStreaming} />
    </>
  );
};
