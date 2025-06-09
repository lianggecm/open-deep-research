"use client";
import { useState, useRef, useEffect } from "react";
import cn from "classnames";
import { ArrowUpIcon } from "./icons";

export const ChatInput = ({
  append,
  disabled,
}: {
  disabled?: boolean;
  append: (message: {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
  }) => void;
}) => {
  const [input, setInput] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chatInput") || "";
    }
    return "";
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 400);
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("chatInput", input);
    }
  }, [input]);

  return (
    <div
      className="p-3 relative overflow-hidden rounded-lg max-w-[640px] mx-auto w-full bg-white flex"
      style={{ boxShadow: "0px 1px 13px -6px rgba(0,0,0,0.2)" }}
    >
      <textarea
        ref={textareaRef}
        className="mb-12 resize-none w-full min-h-12 outline-none bg-transparent placeholder:text-zinc-400 max-h-[240px] overflow-y-auto"
        placeholder="Type your message (Enter to send, Shift+Enter for new line)"
        value={input}
        disabled={disabled}
        onChange={(event) => {
          setInput(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (input === "") {
              return;
            }

            append({
              role: "user",
              content: input.trimEnd(),
              createdAt: new Date(),
            });

            setInput("");
            if (typeof window !== "undefined") {
              localStorage.removeItem("chatInput");
            }
          }
        }}
      />

      <div className="absolute bottom-2.5 right-2.5 flex flex-row gap-2">
        <button
          className={cn(
            "size-[26px] flex flex-row justify-center items-center bg-[#093999] text-white rounded"
          )}
          onClick={() => {
            if (input === "") {
              return;
            }

            append({
              role: "user",
              content: input.trimEnd(),
              createdAt: new Date(),
            });
            setInput("");
            if (typeof window !== "undefined") {
              localStorage.removeItem("chatInput");
            }
          }}
        >
          <ArrowUpIcon size={12} />
        </button>
      </div>
    </div>
  );
};
