/**
 * Storage utilities for Deep Research Pipeline using Upstash Redis
 */

import { Redis } from "@upstash/redis";
import fs from "fs";
import { ResearchState, StreamEvent } from "./schemas";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  automaticDeserialization: false, // Disable automatic deserialization to handle it ourselves
});

// Key generation functions for easy management
const generateKeys = {
  state: (sessionId: string) => `research:${sessionId}:state`,
  stream: (sessionId: string) => `research:${sessionId}:stream`,
};

// Storage functions for research state
export const stateStorage = {
  async store(sessionId: string, state: ResearchState): Promise<void> {
    const key = generateKeys.state(sessionId);
    await redis.set(key, state, { ex: 86400 });
  },

  async get(sessionId: string): Promise<ResearchState | null> {
    const key = generateKeys.state(sessionId);
    const data = await redis.get(key);
    return data ? (JSON.parse(data as string) as ResearchState) : null;
  },

  async delete(sessionId: string): Promise<void> {
    const key = generateKeys.state(sessionId);
    await redis.del(key);
  },
};

// Storage functions for stream events

export const streamStorage = {
  async addEvent(sessionId: string, event: StreamEvent): Promise<void> {
    const key = generateKeys.stream(sessionId);
    const eventData = JSON.stringify(event);

    // Use XADD to add event to the stream
    await redis.xadd(key, "*", { event: eventData });

    // Set expiration on the stream
    await redis.expire(key, 86400); // 24 hours TTL
  },

  async getEvents(
    sessionId: string,
    count: number = 100
  ): Promise<StreamEvent[]> {
    const key = generateKeys.stream(sessionId);

    // Use XRANGE to get events from the stream (oldest to newest)
    const result = (await redis.xrange(
      key,
      "-",
      "+",
      count
    )) as unknown as Array<[string, string[]]>;

    if (!result || !result.length) return [];

    const streamResults = result
      .map(([id, fields]) => {
        try {
          // Find the event field in the array of key-value pairs
          const eventField = fields.find(
            (field: string, index: number) =>
              index % 2 === 0 && field === "event"
          );
          if (!eventField) return null;

          // Get the value that follows the "event" key
          const eventIndex = fields.indexOf(eventField);
          const eventData = fields[eventIndex + 1];

          return JSON.parse(eventData) as StreamEvent;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as StreamEvent[];

    return streamResults.sort((a, b) => a.timestamp - b.timestamp);
  },
};

// Utility function to clean up all data for a session
export const cleanupSession = async (sessionId: string): Promise<void> => {
  const keys = [generateKeys.state(sessionId), generateKeys.stream(sessionId)];

  await Promise.all(keys.map((key) => redis.del(key)));
};
