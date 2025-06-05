import { ResearchEventStreamEvents } from "@/app/api/research/route";
import { FaviconImage } from "@/components/FaviconImage";
import { getDomainFromUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

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
  title: string;
  description?: ReactNode;
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
      return <img src="/timeline/loading.svg" className="size-[10px]" />;
    }

    switch (type) {
      case "search_completed":
        return (
          <img src="/timeline/search.svg" alt="" className="size-[12px]" />
        );
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
      className="relative flex gap-3 pb-8 last:pb-0"
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 relative z-10">
        {getStatusIcon({
          type: type,
          isLast: isLast,
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pl-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm text-[#101828] font-medium">{title}</h3>
        </div>

        {description && (
          <p className="text-[#6a7282] text-sm font-light mb-2 leading-relaxed">
            {description}
          </p>
        )}

        {queries && (
          <div className="space-y-1 mb-2">
            {queries.map((query, idx) => (
              <p
                key={idx}
                className="text-xs text-[#6a7282] font-light pl-2 border-l-2 border-[#D1D5DC]"
              >
                "{query}"
              </p>
            ))}
          </div>
        )}

        {webResults && (
          <div className="space-y-1 mb-2">
            {webResults.map((result, idx) => (
              <div className="flex justify-start items-center w-[202px] overflow-hidden gap-3 px-4 py-3 rounded-lg bg-gray-50 border-[0.7px] border-gray-200">
                <div className="flex flex-col justify-start items-center flex-grow-0 flex-shrink-0 gap-2">
                  <div className="flex flex-col justify-start items-start flex-grow-0 flex-shrink-0 relative gap-1">
                    <p className="flex-grow-0 flex-shrink-0 w-[184px] text-xs text-left text-[#4a5565]">
                      {result.title}
                    </p>
                    <div className="flex justify-start items-center flex-grow-0 flex-shrink-0 relative gap-1">
                      <div className="flex justify-start items-center flex-grow-0 flex-shrink-0 relative gap-1.5">
                        <div className="flex-grow-0 flex-shrink-0 w-3.5 h-3.5 relative overflow-hidden rounded bg-gray-100">
                          <FaviconImage
                            url={result.url}
                            className="w-2.5 h-2.5 absolute left-px top-px object-none"
                          />
                        </div>
                        <p className="flex-grow-0 flex-shrink-0 text-xs font-light text-left text-[#99a1af]">
                          {getDomainFromUrl(result.url)}
                        </p>
                      </div>
                      <img src="/timeline/link.svg" alt="" className="size-3" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
