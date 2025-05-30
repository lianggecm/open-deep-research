import { z } from "zod";

// Schemas
export const researchPlanSchema = z.object({
  queries: z
    .string()
    .array()
    .describe("A list of search queries to thoroughly research the topic"),
});

export const searchResultSchema = z.object({
  title: z.string().describe("The title of the search result"),
  link: z.string().url().describe("The URL of the search result"),
  content: z.string().describe("The content of the web page"),
  summary: z.string().describe("The summary of the web page").optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const researchStateSchema = z.object({
  topic: z.string().describe("The topic of the research"),
  allQueries: z
    .string()
    .array()
    .describe("A list of all queries used in the research"),
  searchResults: searchResultSchema
    .array()
    .describe("A list of search results"),
  budget: z.number().describe("The budget for the research"),
  iteration: z.number().describe("The current iteration of the research"),
});

export type ResearchState = z.infer<typeof researchStateSchema>;

// Stream Event Schemas
// Base event schema
const baseEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  iteration: z.number().optional(),
});

// Planning events
export const planningStartedEventSchema = baseEventSchema.extend({
  type: z.literal("planning_started"),
  topic: z.string(),
});
export const planningCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("planning_completed"),
  plan: z.string().optional(),
  queries: z.string().array(),
});

// Search events
export const searchStartedEventSchema = baseEventSchema.extend({
  type: z.literal("search_started"),
  query: z.string(),
  iteration: z.number(),
});

export const searchCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("search_completed"),
  query: z.string(),
  urls: z.string().array(),
  resultCount: z.number(),
  iteration: z.number(),
});

// Content processing events
export const contentProcessingEventSchema = baseEventSchema.extend({
  type: z.literal("content_processing"),
  url: z.string(),
  title: z.string(),
  query: z.string(),
  content: z.string().optional(),
});

export const contentSummarizedEventSchema = baseEventSchema.extend({
  type: z.literal("content_summarized"),
  url: z.string(),
  title: z.string(),
  query: z.string(),
  summaryFirstHundredChars: z.string().optional(),
});

// Evaluation events
export const evaluationStartedEventSchema = baseEventSchema.extend({
  type: z.literal("evaluation_started"),
  totalResults: z.number(),
  iteration: z.number(),
});

export const evaluationCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("evaluation_completed"),
  needsMore: z.boolean(),
  reasoning: z.string().optional(), // TODO remove optional
  additionalQueries: z.string().array().optional(),
  iteration: z.number(),
});

export const coverGenerationStartedEventSchema = baseEventSchema.extend({
  type: z.literal("cover_generation_started"),
  prompt: z.string(),
});

export const coverGenerationCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("cover_generation_completed"),
  coverImage: z.string(),
});

// Report events
export const reportStartedEventSchema = baseEventSchema.extend({
  type: z.literal("report_started"),
});

export const reportGeneratedEventSchema = baseEventSchema.extend({
  type: z.literal("report_generated"),
  report: z.string().optional(),
});

// Status events
export const iterationCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("iteration_completed"),
  iteration: z.number(),
  totalResults: z.number(),
});

export const researchCompletedEventSchema = baseEventSchema.extend({
  type: z.literal("research_completed"),
  finalResultCount: z.number(),
  totalIterations: z.number(),
});

export const errorEventSchema = baseEventSchema.extend({
  type: z.literal("error"),
  message: z.string(),
  step: z.string(),
  iteration: z.number().optional(),
});

// Union type for all possible events
export const streamEventSchema = z.discriminatedUnion("type", [
  planningStartedEventSchema,
  planningCompletedEventSchema,
  searchStartedEventSchema,
  searchCompletedEventSchema,
  contentProcessingEventSchema,
  contentSummarizedEventSchema,
  evaluationStartedEventSchema,
  evaluationCompletedEventSchema,
  coverGenerationStartedEventSchema,
  coverGenerationCompletedEventSchema,
  reportStartedEventSchema,
  reportGeneratedEventSchema,
  iterationCompletedEventSchema,
  researchCompletedEventSchema,
  errorEventSchema,
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;

// Individual event types for type safety
export type PlanningStartedEvent = z.infer<typeof planningStartedEventSchema>;
export type PlanningCompletedEvent = z.infer<
  typeof planningCompletedEventSchema
>;
export type SearchStartedEvent = z.infer<typeof searchStartedEventSchema>;
export type SearchCompletedEvent = z.infer<typeof searchCompletedEventSchema>;
export type ContentProcessingEvent = z.infer<
  typeof contentProcessingEventSchema
>;
export type ContentSummarizedEvent = z.infer<
  typeof contentSummarizedEventSchema
>;
export type EvaluationStartedEvent = z.infer<
  typeof evaluationStartedEventSchema
>;
export type EvaluationCompletedEvent = z.infer<
  typeof evaluationCompletedEventSchema
>;

export type IterationCompletedEvent = z.infer<
  typeof iterationCompletedEventSchema
>;

export type CoverGenerationStartedEvent = z.infer<
  typeof coverGenerationStartedEventSchema
>;
export type CoverGenerationCompletedEvent = z.infer<
  typeof coverGenerationCompletedEventSchema
>;

export type ReportStartedEvent = z.infer<typeof reportStartedEventSchema>;
export type ReportGeneratedEvent = z.infer<typeof reportGeneratedEventSchema>;

export type ResearchCompletedEvent = z.infer<
  typeof researchCompletedEventSchema
>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
