import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;

const isLocal = process.env.NODE_ENV !== "production";

const ratelimit =
  !isLocal && redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(5, "1440 m"),
        analytics: true,
      })
    : undefined;

export const limitResearch = async ({
  clerkUserId,
}: {
  clerkUserId?: string;
}) => {
  if (!ratelimit || !clerkUserId) {
    return {
      remaining: 5,
      limit: 5,
    };
  }

  const result = await ratelimit.limit(clerkUserId);

  return {
    remaining: result.remaining,
    limit: result.limit,
    reset: result.reset,
  };
};

export const getRemainingResearch = async ({
  clerkUserId,
}: {
  clerkUserId?: string;
}) => {
  if (!ratelimit || !clerkUserId) {
    return {
      remaining: 5,
      reset: null,
    };
  }

  try {
    const result = await ratelimit.getRemaining(clerkUserId);

    return result;
  } catch (e) {
    console.log(e);
    return {
      remaining: 5,
      reset: null,
    };
  }
};
