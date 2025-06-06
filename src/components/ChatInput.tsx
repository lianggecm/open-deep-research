"use client";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import cn from "classnames";
import { ArrowUpIcon, StopIcon } from "./icons";

export const ChatInput = ({
  append,
  stop,
  isGeneratingResponse,
  disabled,
}: {
  disabled?: boolean;
  append: (message: {
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
  }) => void;
  stop: () => void;
  isGeneratingResponse: boolean;
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 400);
    }
  }, []);

  return (
    <div
      className="p-3 relative overflow-hidden rounded-lg max-w-[640px] mx-auto w-full bg-white flex"
      style={{ boxShadow: "0px 1px 13px -6px rgba(0,0,0,0.2)" }}
    >
      <textarea
        ref={textareaRef}
        className="mb-12 resize-none w-full min-h-12 outline-none bg-transparent placeholder:text-zinc-400"
        placeholder="Type in your prompt"
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

            if (isGeneratingResponse) {
              toast.error("Please wait for the model to finish its response!");

              return;
            }

            append({
              role: "user",
              content: input.trimEnd(),
              createdAt: new Date(),
            });

            setInput("");
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

            if (isGeneratingResponse) {
              stop();
            } else {
              append({
                role: "user",
                content: input.trimEnd(),
                createdAt: new Date(),
              });
            }

            setInput("");
          }}
        >
          {isGeneratingResponse ? (
            <StopIcon size={12} />
          ) : (
            <ArrowUpIcon size={12} />
          )}
        </button>
      </div>
    </div>
  );
};
