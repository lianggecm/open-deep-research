"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "search";
  details?: string[];
}

const timelineData: TimelineItem[] = [
  {
    id: "1",
    title: "Research Topic",
    description: "best adult-only resorts in Greece",
    status: "completed",
    details: [
      "Santorini luxury resorts",
      "Mykonos exclusive properties",
      "Crete boutique hotels",
    ],
  },
  {
    id: "2",
    title: "Research Plan",
    description:
      "Top places to visit in Morocco in 2025 include Marrakech, Fes, and the Sahara Desert, known for their history, culture, and stunning landscapes.",
    status: "in-progress",
    details: [
      "Chefchaouen, Essaouira, and Taghazout are rising in popularity for their charm and relaxed atmosphere",
    ],
  },
  {
    id: "3",
    title: "Budget Analysis",
    description:
      "Analyzing cost-effective travel options for Mediterranean destinations",
    status: "completed",
    details: [
      "Flight comparisons",
      "Accommodation pricing",
      "Local transportation costs",
    ],
  },
  {
    id: "4",
    title: "Itinerary Planning",
    description:
      "Creating detailed day-by-day travel schedules for optimal experience",
    status: "in-progress",
    details: [
      "Day 1-3: Athens exploration",
      "Day 4-7: Island hopping",
      "Day 8-10: Cultural sites",
    ],
  },
];

export default function TimelineProgress() {
  const [items, setItems] = useState<TimelineItem[]>(timelineData.slice(0, 2));
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
    if (items.length > 2) {
      setTimeout(scrollToBottom, 100);
    }
  }, [items.length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <img src="/timeline/completed.svg" className="size-[10px]" />;
      case "in-progress":
        return (
          <img
            src="/timeline/loading.svg"
            className="size-[12px] animate-spin"
          />
        );
      case "search":
        return <img src="/timeline/search.svg" className="size-[12px]" />;
      default:
        return <></>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#F3F4F6] border-[#D1D5DC]";
      case "in-progress":
        return "bg-[#F3F4F6] border-[#D1D5DC]";
      default:
        return "bg-[#F3F4F6] border-[#D1D5DC]";
    }
  };

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
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index === items.length - 1 ? 0.2 : 0,
                  }}
                  className="relative flex gap-3 pb-8 last:pb-0"
                >
                  {/* Status indicator */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-[0.7px] flex items-center justify-center ${getStatusColor(
                      item.status
                    )} relative z-10 ml-5`}
                  >
                    {getStatusIcon(item.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#101828]">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-[#6a7282] text-sm mb-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.details && (
                      <div className="space-y-1">
                        {item.details.map((detail, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-[#6a7282] pl-2 border-l-2 border-[#D1D5DC]"
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
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
