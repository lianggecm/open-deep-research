"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchEventStreamEvents } from "@/app/api/research/route";

export default function TimelineProgress({
  events,
}: {
  events: ResearchEventStreamEvents[];
}) {
  const [isGenerating, setIsGenerating] = useState(false);
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div
        ref={scrollContainerRef}
        className="max-h-96 overflow-y-auto rounded-lg bg-white"
      >
        <div className="p-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#D1D5DC]" />

            <AnimatePresence>
              {events.map((event, index) => {
                return <>{/* TimelineEvent */}</>;
              })}
            </AnimatePresence>

            {/* Loading indicator */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex gap-3 pb-8"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-[0.7px] bg-[#F3F4F6] border-[#D1D5DC] flex items-center justify-center relative z-10 ml-5">
                  <div className="w-4 h-4 border-2 border-[#4a5565] border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex-1 min-w-0 pl-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Invisible element to scroll to */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
