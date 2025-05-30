"use client";

import cn from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "./icons";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { DeepResearchTool } from "./DeepResearchTool";
import { Markdown } from "./Markdown";
import { Clipboard, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  details: Array<{ type: "text"; text: string }>;
}

interface ReasoningMessagePartProps {
  part: ReasoningPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false);
    }
  }, [isReasoning]);

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            <SpinnerIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            className={cn(
              "cursor-pointer rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200",
              {
                "dark:bg-zinc-800 bg-zinc-200": isExpanded,
              }
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm dark:text-zinc-400 text-zinc-600 flex flex-col gap-4 border-l pl-3 dark:border-zinc-800"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {part.details.map((detail, detailIndex) =>
              detail.type === "text" ? (
                <Markdown key={detailIndex}>{detail.text}</Markdown>
              ) : (
                "<redacted>"
              )
            )}

            {/* <Markdown components={markdownComponents}>{reasoning}</Markdown> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TextMessagePartProps {
  text: string;
}

export function TextMessagePart({ text }: TextMessagePartProps) {
  return (
    <div className="flex flex-col gap-4">
      <Markdown>{text}</Markdown>
    </div>
  );
}

interface MessagesProps {
  messages: Array<UIMessage>;
  status: UseChatHelpers["status"];
  onResearchEnd?: () => void;
}

function MessageActions({
  copyText,
  createdAt,
}: {
  copyText: string;
  createdAt?: Date;
}) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="flex flex-row items-center justify-end w-full mt-1 min-h-[28px] gap-2 text-xs text-zinc-400 dark:text-zinc-500">
      {createdAt && (
        <span
          className="relative cursor-default select-none"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {formatDistanceToNow(createdAt, { addSuffix: true })}
          {showTooltip && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-zinc-800 text-white text-[10px] whitespace-nowrap z-10 shadow-lg">
              {createdAt.toLocaleString()}
            </span>
          )}
        </span>
      )}
      <button
        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        title={copied ? "Copied!" : "Copy"}
        aria-label="Copy message"
        onClick={async () => {
          await navigator.clipboard.writeText(copyText);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        style={{
          fontSize: 16,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {copied ? <Check size={16} /> : <Clipboard size={16} />}
      </button>
    </div>
  );
}

export function Messages({ messages, status, onResearchEnd }: MessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesLength = useMemo(() => messages.length, [messages]);

  console.log("messages", messages);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messagesLength]);

  // Helper to get all text parts from a message
  function getAssistantText(message: UIMessage) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");
  }

  return (
    <div
      className="flex flex-col gap-8 items-center w-full px-2 bg-white z-10"
      ref={messagesRef}
    >
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        return (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-4 last-of-type:mb-12 first-of-type:mt-16 w-full"
            )}
          >
            <div
              className={cn("flex flex-col gap-4 relative", {
                "dark:bg-zinc-800 bg-zinc-200 p-2 rounded-xl w-fit ml-auto":
                  message.role === "user",
                "": isAssistant,
              })}
            >
              {message.parts
                .sort((a, b) => {
                  const order = {
                    reasoning: 1,
                    text: 2,
                    "tool-invocation": 3,
                    source: 4,
                    file: 5,
                    "step-start": 6,
                  };
                  return (order[a.type] || 99) - (order[b.type] || 99);
                })
                .map((part, partIndex) => {
                  if (part.type === "reasoning") {
                    return (
                      <ReasoningMessagePart
                        key={`${message.id}-${partIndex}`}
                        // @ts-expect-error export ReasoningUIPart
                        part={part}
                        isReasoning={
                          status === "streaming" &&
                          partIndex === message.parts.length - 1
                        }
                      />
                    );
                  }

                  if (part.type === "text") {
                    // Only render the first text part for assistant messages
                    if (
                      isAssistant &&
                      message.parts.findIndex((p) => p.type === "text") !==
                        partIndex
                    ) {
                      return null;
                    }
                    return (
                      <TextMessagePart
                        key={`${message.id}-${partIndex}`}
                        text={part.text}
                      />
                    );
                  }

                  if (part.type === "tool-invocation") {
                    const { toolInvocation } = part;

                    if (toolInvocation.toolName === "startDeepResearch") {
                      return (
                        <DeepResearchTool
                          key={`tool-${toolInvocation.toolCallId}`}
                          args={{
                            topic: toolInvocation.args.topic,
                          }}
                          result={(toolInvocation as any).result}
                          onResearchEnd={onResearchEnd}
                        />
                      );
                    }

                    return (
                      <div key={toolInvocation.toolCallId}>
                        {JSON.stringify(toolInvocation)}
                      </div>
                    );
                  }
                })}
              {/* Message actions for assistant messages */}
              {isAssistant && (
                <MessageActions
                  copyText={getAssistantText(message)}
                  {...(message.createdAt
                    ? { createdAt: new Date(message.createdAt) }
                    : {})}
                />
              )}
            </div>
          </div>
        );
      })}

      {status === "submitted" && (
        <div className="text-zinc-500 mb-12 w-full">Thinking...</div>
      )}
    </div>
  );
}
