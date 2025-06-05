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
  title: ReactNode;
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
      className="relative flex gap-3 pb-8 last:pb-0"
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
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm text-[#101828] font-medium">{title}</h3>
        </div>

        {description && (
          <p className="text-[#6a7282] text-sm font-light mb-2 leading-relaxed">
            {description}
          </p>
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
          <div className="grid grid-cols-2 gap-3 mb-2">
            {webResults.map((result, idx) => (
              <div className="flex justify-start items-center w-full overflow-hidden gap-3 px-4 py-3 rounded-lg bg-gray-50 border-[0.7px] border-gray-200">
                <div className="flex flex-col justify-start items-start  relative gap-1 overflow-hidden">
                  <p className="max-w-full truncate text-xs text-left text-[#4a5565]">
                    {result.title}
                  </p>
                  <div className="flex justify-start items-center  relative gap-1">
                    <div className="flex justify-start items-center  relative gap-1.5">
                      <div className=" w-3.5 h-3.5 relative overflow-hidden rounded bg-gray-100">
                        <FaviconImage
                          url={result.url}
                          className="w-2.5 h-2.5 absolute left-px top-px object-none"
                        />
                      </div>
                      <p className=" text-xs font-light text-left text-[#99a1af]">
                        {getDomainFromUrl(result.url)}
                      </p>
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2"
                    >
                      <img src="/timeline/link.svg" alt="" className="size-3" />
                    </a>
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
