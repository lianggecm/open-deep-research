"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Clock } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  timestamp: string;
  details?: string[];
}

const timelineData: TimelineItem[] = [
  {
    id: "1",
    title: "Research Topic",
    description: "best adult-only resorts in Greece",
    status: "completed",
    timestamp: "2 hours ago",
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
    timestamp: "1 hour ago",
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
    timestamp: "45 minutes ago",
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
    timestamp: "30 minutes ago",
    details: [
      "Day 1-3: Athens exploration",
      "Day 4-7: Island hopping",
      "Day 8-10: Cultural sites",
    ],
  },
  {
    id: "5",
    title: "Booking Coordination",
    description:
      "Coordinating reservations for flights, hotels, and activities",
    status: "pending",
    timestamp: "15 minutes ago",
    details: [
      "Flight bookings pending",
      "Hotel confirmations needed",
      "Activity reservations in progress",
    ],
  },
  {
    id: "6",
    title: "Travel Documentation",
    description: "Preparing all necessary travel documents and requirements",
    status: "pending",
    timestamp: "10 minutes ago",
    details: [
      "Passport validity check",
      "Visa requirements",
      "Travel insurance",
    ],
  },
  {
    id: "7",
    title: "Final Review",
    description:
      "Comprehensive review of all travel arrangements and preparations",
    status: "pending",
    timestamp: "Just now",
    details: [
      "Checklist verification",
      "Emergency contacts",
      "Local currency preparation",
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

  // Simulate adding new timeline items
  const addNewItem = () => {
    if (items.length >= timelineData.length) return;

    setIsGenerating(true);

    setTimeout(() => {
      setItems((prev) => [...prev, timelineData[prev.length]]);
      setIsGenerating(false);
    }, 1500);
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
        return <Check className="w-4 h-4 text-[#101828]" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-[#4a5565] animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-[#99a1af]" />;
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
                      <span className="text-xs text-[#99a1af]">
                        {item.timestamp}
                      </span>
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

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={addNewItem}
          disabled={isGenerating || items.length >= timelineData.length}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "Generating..." : "Add Timeline Item"}
        </button>

        <button
          onClick={() => setItems(timelineData.slice(0, 2))}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reset Timeline
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• Timeline automatically scrolls to show the most recent items</p>
        <p>• Click "Add Timeline Item" to see the auto-scroll behavior</p>
      </div>
    </div>
  );
}
