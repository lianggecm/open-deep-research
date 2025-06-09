import { FaviconImage } from "@/components/FaviconImage";
import { getDomainFromUrl } from "@/lib/utils";
import React from "react";

export const WebResultCard = ({
  result,
  id,
}: {
  result: { url: string; title: string };
  id: string;
}) => {
  return (
    <a
      key={id}
      href={result.url}
      target="_blank"
      rel="noreferrer"
      className="flex justify-start items-center w-full overflow-hidden gap-3 px-4 py-3 rounded-lg bg-gray-50 border-[0.7px] border-gray-200"
    >
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
          <div className="p-2">
            <img src="/timeline/link.svg" alt="" className="size-3" />
          </div>
        </div>
      </div>
    </a>
  );
};
