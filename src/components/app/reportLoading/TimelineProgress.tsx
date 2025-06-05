"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ResearchEventStreamEvents } from "@/app/api/research/route";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineEventLoader } from "./TimelineEventLoader";
import { CustomMarkdown } from "@/components/CustomMarkdown";

export default function TimelineProgress({
  events,
}: {
  events: ResearchEventStreamEvents[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items are added
  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Auto-scroll when items change
  useEffect(() => {
    if (events.length > 2) {
      setTimeout(scrollToBottom, 100);
    }
  }, [events.length]);

  // we only want to render specific events:
  // for planning_started we render topic
  // for planning_completed we render the plan
  // for search_started we render the query like
  // Searching for "What is the capital of France?"
  // for search_completed we render the results with list of pages we we won't render the previous search_started linked to this query

  // for evaluation_started we render a loading indicator
  // for evaluation_completed we render the evaluation results hiding previous evaluation_started linked to this evaluation and we show the reasoning

  // for report_started we render a loading indicator
  // for report_completed we render the report hiding previous report_started linked to this report and we incrementally show new report_generating events until report_completed

  const renderableEvents: ResearchEventStreamEvents[] = [];

  for (let i = 0; i < events.length; i++) {
    const currentEvent = events[i];
    const remainingEvents = events.slice(i + 1);

    switch (currentEvent.type) {
      case "report_started":
        // Hide report_started if there's any subsequent report_generating
        const subsequentReportEvents = remainingEvents.some(
          (e) => e.type === "report_generating"
        );
        if (!subsequentReportEvents) {
          renderableEvents.push(currentEvent);
        }
        break;
      case "report_generating":
        // Only include the last report_generating event before a new phase or report_completed
        const isLastGenerating = !remainingEvents.some(
          (e) => e.type === "report_generating"
        );
        if (isLastGenerating) {
          renderableEvents.push(currentEvent);
        }
        break;

      default:
        // Include all other event types
        renderableEvents.push(currentEvent);
        break;
    }
  }

  if (renderableEvents.length <= 1) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto rounded-lg bg-white"
      >
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[9px] top-[1px] bottom-0 w-0.5 bg-[#D1D5DC]" />

          <AnimatePresence>
            {renderableEvents
              .map((event, index) => {
                const isLast = index === renderableEvents.length - 1;

                switch (event.type) {
                  case "planning_started":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title="Research Topic"
                        description={event.topic}
                      />
                    );

                  case "planning_completed":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title="Research Plan"
                        description={
                          <CustomMarkdown>{event.plan || ""}</CustomMarkdown>
                        }
                      />
                    );

                  case "search_completed":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title={
                          <>
                            <span className="text-sm font-light text-left text-[#6a7282]">
                              Searched for
                            </span>
                            <span className="ml-1 text-sm text-left text-[#4a5565]">
                              ‘{event.query}‘
                            </span>
                          </>
                        }
                        webResults={event.urls.map((url) => {
                          return {
                            url: url,
                            title: url,
                          };
                        })}
                      />
                    );

                  case "evaluation_completed":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title="Evaluation Complete"
                        description={
                          <CustomMarkdown>
                            {event.reasoning?.slice(0, 200) + "..." || ""}
                          </CustomMarkdown>
                        }
                      />
                    );

                  case "report_started":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title="Generating Report"
                      />
                    );

                  case "report_generating":
                    return (
                      <TimelineEvent
                        key={index}
                        type={event.type}
                        isLast={isLast}
                        title="Writing report..."
                        description={event.partialReport}
                      />
                    );

                  default:
                    return null;
                }
              })
              .filter(Boolean)}
          </AnimatePresence>

          <TimelineEventLoader />

          {/* Invisible element to scroll to */}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
