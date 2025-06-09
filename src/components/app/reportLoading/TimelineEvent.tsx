import { ResearchEventStreamEvents } from "@/app/api/research/route";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { WebResultCard } from "@/components/app/reportLoading/WebResultCard";
import { cn } from "@/lib/utils";

export const TimelineEvent = ({
  isLast,
  type,
  title,
  description,
  queries,
  webResults,
}: {
  type: ResearchEventStreamEvents["type"];
  isLast: boolean;
  title: ReactNode;
  description?: string;
  queries?: string[];
  webResults?: {
    url: string;
    title: string;
  }[];
}) => {
  const getStatusIcon = ({
    type,
    isLast,
  }: {
    type: ResearchEventStreamEvents["type"];
    isLast: boolean;
  }) => {
    if (isLast) {
      return (
        <img src="/timeline/loading.svg" className="size-[10px] animate-spin" />
      );
    }

    switch (type) {
      case "search_completed":
        return (
          <img src="/timeline/search.svg" alt="" className="size-[12px]" />
        );
      default:
        return <img src="/timeline/completed.svg" className="size-[10px]" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: isLast ? 0.2 : 0,
      }}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      {/* Status indicator */}
      <div className="flex flex-shrink-0 relative z-10 size-5 min-w-[20px] bg-[#F3F4F6] rounded-full border border-[#101828]flex items-center justify-center">
        {getStatusIcon({
          type: type,
          isLast: isLast,
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm text-[#101828] font-medium">{title}</h3>
        </div>

        {description && (
          <div
            className={cn(
              "relative max-h-40 overflow-hidden",
              description && description.length > 100
                ? "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-16 after:bg-gradient-to-b after:from-transparent after:to-white"
                : ""
            )}
          >
            <p className="text-[#6a7282] text-sm font-light mb-2 leading-relaxed bg-gradient-to-r from-[#6a7282] to-[#4a5565] bg-clip-text">
              {description}
            </p>
          </div>
        )}

        {queries && (
          <div className="mb-2 flex fle-row flex-wrap gap-2">
            {queries.map((query, idx) => (
              <div
                key={idx}
                className="flex justify-center items-center relative gap-2.5 px-2.5 py-[5px] rounded bg-gray-200"
              >
                <p className=" text-xs text-left text-[#4a5565]">{query}</p>
              </div>
            ))}
          </div>
        )}

        {webResults && (
          <div className="flex flex-col md:grid grid-cols-2 gap-3 mb-2">
            {webResults.map((result, idx) => (
              <WebResultCard
                key={result.url + "-" + idx}
                result={result}
                idx={idx}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
