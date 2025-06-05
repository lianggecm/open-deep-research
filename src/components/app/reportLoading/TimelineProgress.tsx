"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  details?: string[];
  queries?: string[];
  webResults?: string[];
}

const timelineData: TimelineItem[] = [
  {
    id: "1",
    title: "Research Topic",
    description: "best adult-only resorts in Greece",
    status: "completed",
  },
  {
    id: "2",
    title: "Research Plan",
    description:
      "Top places to visit in Morocco in 2025 include Marrakech, Fes, and the Sahara Desert, known for their history, culture, and stunning landscapes. Chefchaouen, Essaouira, and Taghazout are rising in popularity for their charm and relaxed atmosphere. The best times to visit are spring and fall, offering pleasant weather. Recent trends favor hidden gems and authentic local experiences, so checking traveler reviews and local tips is highly recommended for a more rewarding trip.",
    status: "completed",
  },
  {
    id: "3",
    title: "Generating Search Queries",
    description: "Creating targeted search queries for comprehensive research",
    status: "completed",
    queries: [
      "best adult-only resorts Greece 2025",
      "luxury adults-only hotels Santorini Mykonos",
      "exclusive adult resorts Greek islands reviews",
    ],
  },
  {
    id: "4",
    title: 'Searched for "best adult-only resorts Greece 2025"',
    description: "Found relevant web page results",
    status: "completed",
    webResults: [
      "TripAdvisor: Top 10 Adults-Only Resorts in Greece",
      "Booking.com: Best Adult-Only Hotels in Greek Islands",
      "Travel + Leisure: Luxury Adults-Only Resorts Greece 2025",
    ],
  },
  {
    id: "5",
    title: "Evaluation Step",
    description: "Generating additional search queries for deeper research",
    status: "completed",
    queries: [
      "Santorini adults only boutique hotels amenities",
      "Mykonos luxury resorts adults only pricing 2025",
    ],
  },
  {
    id: "6",
    title: 'Searched for "Santorini adults only boutique hotels amenities"',
    description: "Found additional web page results",
    status: "completed",
    webResults: [
      "Conde Nast Traveler: Best Santorini Adults-Only Hotels",
      "Hotels.com: Santorini Boutique Resorts with Spa",
      "Expedia: Top-Rated Adult Resorts Santorini Reviews",
    ],
  },
  {
    id: "7",
    title: "Writing Report",
    description:
      "Top places to visit in Morocco in 2025 include Marrakech, Fes, and the Sahara Desert, known for their history, culture, and stunning landscapes. Chefchaouen, Essaouira, and Taghazout are rising in popularity for their charm and relaxed atmosphere. The best times to visit are spring and fall, offering pleasant weather. Recent trends favor hidden gems and authentic local experiences, so checking traveler reviews and local tips is highly recommended for a more rewarding trip.",
    status: "in-progress",
    details: [
      "Image Prompt: A vibrant, stylized illustration of a colorful souk scene, with intricate patterns and textures, set against a stunning backdrop of majestic desert landscapes and historic architecture, featuring a hot air balloon soaring above, with a few camels and donkeys roaming freely in the foreground.",
    ],
  },
];

export default function TimelineProgress() {
  const [items, setItems] = useState<TimelineItem[]>(timelineData);
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
        return (
          <svg
            width={22}
            height={22}
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            preserveAspectRatio="none"
          >
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              fill="#F3F4F6"
            />
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              stroke="#D1D5DC"
              strokeWidth="0.5"
            />
            <path
              d="M7.875 11.3125L10.375 13.8125L14.125 8.1875"
              stroke="#101828"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "in-progress":
        return (
          <svg
            width={22}
            height={22}
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            preserveAspectRatio="none"
          >
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              fill="#F3F4F6"
            />
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              stroke="#D1D5DC"
              strokeWidth="0.5"
            />
            <div className="w-3 h-3 border-2 border-[#101828] border-t-transparent rounded-full animate-spin" />
          </svg>
        );
      case "pending":
        return (
          <svg
            width={22}
            height={22}
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            preserveAspectRatio="none"
          >
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              fill="#F3F4F6"
            />
            <rect
              x="0.75"
              y="0.75"
              width="20.5"
              height="20.5"
              rx="10.25"
              stroke="#D1D5DC"
              strokeWidth="0.5"
            />
          </svg>
        );
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
