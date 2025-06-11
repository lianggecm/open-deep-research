import React from "react";
import { cn, extractMarkdownHeadings } from "@/lib/utils";

export const TableOfContents = ({ markdown }: { markdown: string }) => {
  const headings = extractMarkdownHeadings(markdown).filter(
    (h) => h.level === 2
  );

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-full max-w-xs xl:max-w-[220px] mb-6 xl:mb-0 xl:mr-6 sticky top-6">
      <ul className="space-y-1">
        {headings.map((heading, idx) => {
          const anchor = heading.text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return (
            <li key={idx} className={heading.level === 2 ? "ml-4" : ""}>
              <a
                href={`#${anchor}`}
                className={cn(
                  false
                    ? "text-sm font-medium text-left text-[#0f172b]"
                    : "text-sm font-light text-left text-[#62748e]"
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
