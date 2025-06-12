import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReportBody } from "../ReportBody";

function splitIntoSentences(text: string): string[] {
  // This regex splits on sentence-ending punctuation followed by a space or end of string
  return text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [];
}

export const StreamingReportBody = ({
  report,
  coverUrl,
  researchTopic,
}: {
  report: string;
  coverUrl: string;
  researchTopic: string;
}) => {
  const [displayedSentences, setDisplayedSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sentences = report ? splitIntoSentences(report) : [];
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // When report changes, stream in new sentences
  useEffect(() => {
    if (!report) {
      setDisplayedSentences([]);
      setCurrentIndex(0);
      return;
    }
    if (currentIndex >= sentences.length) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < sentences.length) {
          setDisplayedSentences(sentences.slice(0, prev + 1));
          return prev + 1;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
      });
    }, 400); // Adjust speed here for sentences
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, sentences.length]);

  // If report shrinks (shouldn't happen, but for safety)
  useEffect(() => {
    if (currentIndex > sentences.length) {
      setCurrentIndex(sentences.length);
      setDisplayedSentences(sentences);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences.length]);

  // Compose the currently streamed report string
  const streamedReport = displayedSentences.join("");

  return (
    <div className="w-full">
      <ReportBody
        researchData={{
          researchTopic,
          coverUrl,
          report: streamedReport,
          sources: [],
          citations: [],
        }}
      />
    </div>
  );
};
