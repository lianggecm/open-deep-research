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

// 1 per day
const ratelimit =
  !isLocal && redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.fixedWindow(1, "1440 m"),
        analytics: true,
      })
    : undefined;

// Whitelist of users with unlimited reports
const unlimitedUsers = [
  "user_2yHc1OHZXTGhAfnxxWTlU5Eu6wc",
  "user_2xp4SMtYXT9nnZ6sdpzcreUdpV7",
];

const DEFAULT_LIMIT = 5;
const DEFAULT_RESET = null;

const fallbackResult = {
  remaining: DEFAULT_LIMIT,
  limit: DEFAULT_LIMIT,
  reset: DEFAULT_RESET,
};

export const limitResearch = async ({
  clerkUserId,
}: {
  clerkUserId?: string;
}) => {
  // Unlimited for whitelisted users
  if (
    (clerkUserId && unlimitedUsers.includes(clerkUserId)) ||
    !ratelimit ||
    !clerkUserId
  ) {
    return fallbackResult;
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
  // Unlimited for whitelisted users
  if (
    (clerkUserId && unlimitedUsers.includes(clerkUserId)) ||
    !ratelimit ||
    !clerkUserId
  ) {
    return fallbackResult;
  }

  try {
    const result = await ratelimit.getRemaining(clerkUserId);

    return result;
  } catch (e) {
    console.log(e);
    return fallbackResult;
  }
};
