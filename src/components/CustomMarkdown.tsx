import React from "react";
import remarkGfm from "remark-gfm";

import { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { FaviconImage } from "./FaviconImage";

const markdownComponents: Partial<Components> = {
  p: ({ children }) => (
    <p className="text-base font-light text-left text-[#0f172b] leading-6 pb-4">
      {children}
    </p>
  ),
  hr: ({ children }) => <hr className="pb-4" />,
  pre: ({ children }) => <>{children}</>,
  img: ({ children, ...props }) => {
    return <img className="max-w-full rounded-lg" {...props} />;
  },
  ol: ({ children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ children, ...props }) => {
    if (children?.toString() === "INLINE_CITATION") {
      return (
        <a
          href={props.href}
          className="text-blue-500 hover:underline"
          {...props}
        >
          <FaviconImage url={props.href || ""} />
        </a>
      );
    }

    return (
      // @ts-expect-error - Link component expects href prop from markdown-parsed anchor tags
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ children, ...props }) => {
    return (
      <h1
        className="text-[28px] font-medium text-left text-[#0f172b] mb-2"
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    return (
      <h2
        className="text-2xl text-left font-medium text-[#0f172b] mb-2"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    return (
      <h3 className="text-xl text-left text-[#0f172b] mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    return (
      <h4 className="text-lg text-left text-[#0f172b] mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ children, ...props }) => {
    return (
      <h5 className="text-base text-left text-[#0f172b] mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ children, ...props }) => {
    return (
      <h6 className="text-sm text-left text-[#0f172b] mb-2" {...props}>
        {children}
      </h6>
    );
  },
  table: ({ children, ...props }) => {
    return (
      <div className="w-full overflow-auto">
        <table
          className="w-full text-sm text-left border-collapse my-4 rounded-lg overflow-hidden"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead: ({ children, ...props }) => {
    return (
      <thead className="bg-muted" {...props}>
        {children}
      </thead>
    );
  },
  th: ({ children, ...props }) => {
    return (
      <th
        className="px-4 py-2 font-semibold text-foreground border-b border-border"
        {...props}
      >
        {children}
      </th>
    );
  },
  td: ({ children, ...props }) => {
    return (
      <td className="px-4 py-2 border-b border-border" {...props}>
        {children}
      </td>
    );
  },
  tr: ({ children, ...props }) => {
    return (
      <tr className="hover:bg-accent transition-colors" {...props}>
        {children}
      </tr>
    );
  },
};

export const CustomMarkdown: React.FC<{
  children: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = "", style }) => {
  // TODO: Consider sanitizing HTML output for security if user input is rendered
  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {children}
    </ReactMarkdown>
  );
};
