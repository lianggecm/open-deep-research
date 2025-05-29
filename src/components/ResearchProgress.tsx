"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Search,
  Brain,
  FileText,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  BarChart3,
} from "lucide-react";
import { ResearchEventStreamEvents } from "@/app/api/research/route";
import Markdown from "react-markdown";
import { markdownComponents } from "./markdown-components";

interface ResearchProgressProps {
  events: ResearchEventStreamEvents[];
  isStreaming: boolean;
}

interface ProcessedStep {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  type: string;
  iteration?: number;
  data: ResearchEventStreamEvents[];
  timestamp: number;
}

// Process events into steps
const processSteps = (events: ResearchEventStreamEvents[]): ProcessedStep[] => {
  const steps: ProcessedStep[] = [];
  let currentIteration = 0;

  // Group events by type and iteration
  const eventGroups: { [key: string]: ResearchEventStreamEvents[] } = {};

  events.forEach((event) => {
    if (event.iteration && event.iteration > currentIteration) {
      currentIteration = event.iteration;
    }

    const key = `${event.type}-${event.iteration || 0}`;
    if (!eventGroups[key]) {
      eventGroups[key] = [];
    }
    eventGroups[key].push(event);
  });

  // Create planning step
  const planningEvents = events.filter(
    (e) => e.type === "planning_started" || e.type === "planning_completed"
  );
  if (planningEvents.length > 0) {
    steps.push({
      id: "planning",
      title: "Initial Planning",
      status: planningEvents.some((e) => e.type === "planning_completed")
        ? "completed"
        : "in-progress",
      type: "planning",
      data: planningEvents,
      timestamp: planningEvents[0].timestamp,
    });
  }

  // Create iteration steps
  for (let i = 1; i <= currentIteration; i++) {
    const iterationEvents = events.filter((e) => e.iteration === i);

    // Search queries step
    const searchEvents = iterationEvents.filter(
      (e) => e.type === "search_started" || e.type === "search_completed"
    );
    if (searchEvents.length > 0) {
      const queries = [
        ...new Set(searchEvents.map((e) => e.query).filter(Boolean)),
      ];
      queries.forEach((query, idx) => {
        const queryEvents = searchEvents.filter((e) => e.query === query);
        steps.push({
          id: `search-${i}-${idx}`,
          title: `${query?.substring(0, 40)}...`,
          status: queryEvents.some((e) => e.type === "search_completed")
            ? "completed"
            : "in-progress",
          type: "search",
          iteration: i,
          data: queryEvents,
          timestamp: queryEvents[0].timestamp,
        });
      });
    }

    // Content processing step
    const contentEvents = iterationEvents.filter(
      (e) => e.type === "content_processing" || e.type === "content_summarized"
    );
    if (contentEvents.length > 0) {
      steps.push({
        id: `content-${i}`,
        title: `Content Analysis (${
          contentEvents.filter((e) => e.type === "content_summarized").length
        } summaries)`,
        status: "completed",
        type: "content",
        iteration: i,
        data: contentEvents,
        timestamp: contentEvents[0].timestamp,
      });
    }

    // Evaluation step
    const evaluationEvents = iterationEvents.filter(
      (e) =>
        e.type === "evaluation_started" || e.type === "evaluation_completed"
    );
    if (evaluationEvents.length > 0) {
      steps.push({
        id: `evaluation-${i}`,
        title: `Evaluation & Planning`,
        status: evaluationEvents.some((e) => e.type === "evaluation_completed")
          ? "completed"
          : "in-progress",
        type: "evaluation",
        iteration: i,
        data: evaluationEvents,
        timestamp: evaluationEvents[0].timestamp,
      });
    }
  }

  // Report generation step
  const reportEvents = events.filter(
    (e) => e.type === "report_started" || e.type === "report_generated"
  );
  if (reportEvents.length > 0) {
    steps.push({
      id: "report",
      title: "Report Generation",
      status: reportEvents.some((e) => e.type === "report_generated")
        ? "completed"
        : "in-progress",
      type: "report",
      data: reportEvents,
      timestamp: reportEvents[0].timestamp,
    });
  }

  return steps;
};

export default function ResearchProgress({
  events,
  isStreaming,
}: ResearchProgressProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Automatically select the latest step when new events arrive
  const steps = useMemo(() => {
    const processedSteps = processSteps(events);
    // Auto-select the latest step when steps increase
    if (processedSteps.length > 0) {
      const latestStep = processedSteps[processedSteps.length - 1];
      setSelectedStep(latestStep.id);
    }
    return processedSteps;
  }, [events]);

  const selectedStepData = steps.find((step) => step.id === selectedStep);

  const getStepIcon = (type: string) => {
    switch (type) {
      case "planning":
        return <Brain className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      case "content":
        return <FileText className="h-4 w-4" />;
      case "evaluation":
        return <BarChart3 className="h-4 w-4" />;
      case "report":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-300";
      default:
        return "bg-gray-300";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const renderLoadingState = () => (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Processing...</span>
    </div>
  );

  const renderStepDetails = (step: ProcessedStep) => {
    switch (step.type) {
      case "planning":
        const planningCompleted = step.data.find(
          (e) => e.type === "planning_completed"
        );
        return (
          <div className="space-y-3">
            {!planningCompleted && renderLoadingState()} {/* Reduced space */}
            <div>
              <h4 className="font-semibold mb-1.5 text-sm">Research Topic</h4>{" "}
              {/* Reduced margin and text size */}
              <p className="text-xs text-muted-foreground">
                {step.data[0]?.type}
              </p>
            </div>
            {planningCompleted?.queries && (
              <div>
                <h4 className="font-semibold mb-1.5 text-sm">
                  Generated Queries
                </h4>{" "}
                {/* Reduced margin and text size */}
                <div className="space-y-1.5">
                  {" "}
                  {/* Reduced space */}
                  {planningCompleted.queries.map((query, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="mr-1.5 mb-1.5 px-2 py-0.5 text-xs truncate"
                    >
                      {" "}
                      {/* Reduced margins, padding, text size */}
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {planningCompleted?.plan && (
              <div>
                <h4 className="font-semibold mb-1.5 text-sm">Research Plan</h4>{" "}
                {/* Reduced margin and text size */}
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-52 overflow-y-auto">
                  {" "}
                  {/* Reduced max-h, text size */}
                  <Markdown components={markdownComponents}>
                    {planningCompleted.plan}
                  </Markdown>
                </div>
              </div>
            )}
          </div>
        );

      case "search":
        const searchCompleted = step.data.find(
          (e) => e.type === "search_completed"
        );
        return (
          <div className="space-y-3">
            {!searchCompleted && renderLoadingState()}
            {searchCompleted?.urls && (
              <div>
                <h4 className="font-semibold mb-1.5 text-sm">
                  Search Results ({searchCompleted.resultCount})
                </h4>
                <div className="space-y-1.5">
                  {" "}
                  {/* Reduced space */}
                  {searchCompleted.urls.map((url, idx) => {
                    const contentProcessing = events
                      .filter((e) => e.type === "content_processing")
                      .find((e) => e.url === url);

                    const contentSummarised = events
                      .filter((e) => e.type === "content_summarized")
                      .find((e) => e.url === url);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 p-1.5 border rounded "
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex flex-row gap-1.5">
                            <img
                              className="size-3.5 rounded-full" /* Reduced icon size */
                              src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(
                                url
                              )}`}
                            />
                            <div className="">
                              <p className="text-xs font-medium truncate">
                                {getDomainFromUrl(url)}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[360px]">
                                {" "}
                                {/* Further reduced text size */}
                                {url}
                              </p>
                            </div>
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                          </a>
                          {/* Reduced icon size */}
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          {contentProcessing?.content && (
                            <AccordionItem value="webpage-content">
                              <AccordionTrigger className="text-xs !py-2">
                                Web Page Content
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-[10px] text-muted-foreground bg-muted p-0.5 rounded">
                                  {contentProcessing?.content.slice(0, 2000)}...
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          )}
                          {contentSummarised?.summaryFirstHundredChars && (
                            <AccordionItem value="summary">
                              <AccordionTrigger className="text-xs !py-2">
                                Summary of Page
                              </AccordionTrigger>
                              <AccordionContent>
                                <p className="text-[10px] text-muted-foreground bg-muted p-0.5 rounded">
                                  {contentSummarised?.summaryFirstHundredChars}
                                  ...
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          )}
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "content":
        const summarizedContent = step.data.filter(
          (e) => e.type === "content_summarized"
        );
        const processingContent = step.data.filter(
          (e) => e.type === "content_processing"
        );

        return (
          <div className="space-y-3">
            {processingContent.length > summarizedContent.length &&
              renderLoadingState()}{" "}
            {/* Reduced space */}
            <div>
              <h4 className="font-semibold mb-1.5 text-sm">
                Content Processing Status
              </h4>{" "}
              {/* Reduced margin and text size */}
              <p className="text-xs text-muted-foreground">
                {summarizedContent.length} of {processingContent.length} pages
                summarized
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1.5 text-sm">
                Processed Content
              </h4>{" "}
              {/* Reduced margin and text size */}
              <div className="space-y-2">
                {" "}
                {/* Reduced space */}
                {summarizedContent.map((content, idx) => (
                  <div key={idx} className="border rounded p-2">
                    {" "}
                    {/* Reduced padding */}
                    <div className="flex items-start space-x-1.5 mb-1.5">
                      {" "}
                      {/* Reduced space and margin */}
                      <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />{" "}
                      {/* Reduced icon size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {content.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {" "}
                          {/* Further reduced text size */}
                          {content.url}
                        </p>
                      </div>
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />{" "}
                      {/* Reduced icon size */}
                    </div>
                    {content.summaryFirstHundredChars && (
                      <p className="text-[10px] text-muted-foreground">
                        {" "}
                        {/* Further reduced text size */}
                        {truncateText(content.summaryFirstHundredChars, 150)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "evaluation":
        const evaluationCompleted = step.data.find(
          (e) => e.type === "evaluation_completed"
        );
        return (
          <div className="space-y-3">
            {!evaluationCompleted && renderLoadingState()} {/* Reduced space */}
            <div>
              <h4 className="font-semibold mb-1.5 text-sm">
                Evaluation Results
              </h4>{" "}
              {/* Reduced margin and text size */}
              {evaluationCompleted && (
                <div className="space-y-1.5">
                  {" "}
                  {/* Reduced space */}
                  <div className="flex items-center space-x-1.5">
                    {" "}
                    {/* Reduced space */}
                    <span className="text-xs">Continue Research:</span>
                    <Badge
                      variant={
                        evaluationCompleted.needsMore
                          ? "destructive"
                          : "default"
                      }
                      className="px-2 py-0.5 text-xs" /* Reduced padding and text size */
                    >
                      {evaluationCompleted.needsMore ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            {evaluationCompleted?.additionalQueries && (
              <div>
                <h4 className="font-semibold mb-1.5 text-sm">Next Queries</h4>{" "}
                {/* Reduced margin and text size */}
                <div className="space-y-1">
                  {" "}
                  {/* Reduced space */}
                  {evaluationCompleted.additionalQueries.map((query, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="mr-1.5 mb-1.5 px-2 py-0.5 text-xs"
                    >
                      {" "}
                      {/* Reduced margins, padding, text size */}
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {evaluationCompleted?.reasoning && (
              <div>
                <h4 className="font-semibold mb-1.5 text-sm">Reasoning</h4>{" "}
                {/* Reduced margin and text size */}
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {" "}
                  {/* Reduced max-h, text size */}
                  {truncateText(evaluationCompleted.reasoning, 500)}
                  <Markdown components={markdownComponents}>
                    {evaluationCompleted.reasoning}
                  </Markdown>
                </div>
              </div>
            )}
          </div>
        );

      case "report":
        const reportGenerated = step.data.find(
          (e) => e.type === "report_generated"
        );
        return (
          <div className="space-y-3">
            {" "}
            {/* Reduced space */}
            <div>
              <h4 className="font-semibold mb-1.5 text-sm">
                Report Generation
              </h4>{" "}
              {/* Reduced margin and text size */}
              {reportGenerated && (
                <div className="space-y-1.5">
                  {" "}
                  {/* Reduced space */}
                  <div className="text-xs text-muted-foreground">
                    Report Length: {reportGenerated.reportLength} characters
                  </div>
                  <Badge variant="default" className="px-2 py-0.5 text-xs">
                    Report Complete
                  </Badge>{" "}
                  {/* Reduced padding and text size */}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>No details available</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-background text-sm border rounded-lg">
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-muted/30">
        <div className="p-3 border-b">
          <h2 className="text-md font-semibold">Research Progress</h2>
          <p className="text-xs text-muted-foreground truncate">
            {events.find((e) => e.type === "planning_started")?.topic}
          </p>
        </div>
        <ScrollArea className="">
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {steps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant={selectedStep === step.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-2 text-xs"
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <div className="flex items-start space-x-2 w-full">
                      <div className="flex-col items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                            /* Reduced status dot size */
                            step.status
                          )}`}
                        />
                        {idx < steps.length - 1 && (
                          <div className="w-0.5 h-6 bg-border mt-1.5" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          {" "}
                          {/* Reduced space and margin */}
                          {getStepIcon(step.type)}{" "}
                          {/* Icons are already h-4 w-4, which is small */}
                          <span className="font-medium">{step.title}</span>{" "}
                          {/* Removed explicit text-sm, inherits from parent */}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(step.timestamp)}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        {selectedStepData ? (
          <>
            <div className="p-4 border-b">
              {" "}
              {/* Reduced padding */}
              <div className="flex items-center space-x-2 mb-1.5">
                {" "}
                {/* Reduced space and margin */}
                {getStepIcon(selectedStepData.type)}
                <h1 className="text-lg font-semibold">
                  {" "}
                  {/* Reduced heading size */}
                  {selectedStepData.title}
                </h1>
                <Badge
                  variant={
                    selectedStepData.status === "completed"
                      ? "default"
                      : "secondary"
                  }
                  className="px-2 py-0.5 text-xs" /* Reduced badge padding and text size */
                >
                  {selectedStepData.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(selectedStepData.timestamp)}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">{renderStepDetails(selectedStepData)}</div>{" "}
              {/* Reduced padding */}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Step</h3>
              <p className="text-muted-foreground">
                Choose a step from the left panel to view detailed information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
