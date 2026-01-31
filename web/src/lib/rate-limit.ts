import { getRedis } from "./redis";
import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyPrefix?: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyPrefix: "rl",
};

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { windowMs, max, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const redis = getRedis();

  // If Redis is not available, allow request (fail open in dev)
  if (!redis) {
    return { success: true, remaining: max, reset: Date.now() + windowMs };
  }

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const redisKey = `${keyPrefix}:${key}:${windowStart}`;

  try {
    const multi = redis.multi();
    multi.incr(redisKey);
    multi.pexpire(redisKey, windowMs);
    const results = await multi.exec();

    const count = (results?.[0]?.[1] as number) || 0;
    const remaining = Math.max(0, max - count);
    const reset = windowStart + windowMs;

    return {
      success: count <= max,
      remaining,
      reset,
    };
  } catch (error) {
    console.error("[RateLimit] Error:", error);
    // Fail open on error
    return { success: true, remaining: max, reset: Date.now() + windowMs };
  }
}

/**
 * Get identifier for rate limiting from request
 */
export function getRateLimitKey(request: NextRequest): string {
  // Try to get user ID from session header (set by auth)
  const userId = request.headers.get("x-user-id");
  if (userId) return `user:${userId}`;

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ||
             request.headers.get("x-real-ip") ||
             "unknown";
  return `ip:${ip}`;
}

/**
 * Rate limit middleware response
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Trop de requetes",
      message: "Veuillez reessayer dans quelques instants",
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication - strict
  auth: { windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "rl:auth" },

  // API general - moderate
  api: { windowMs: 60 * 1000, max: 100, keyPrefix: "rl:api" },

  // Write operations - stricter
  write: { windowMs: 60 * 1000, max: 30, keyPrefix: "rl:write" },

  // File uploads - very strict
  upload: { windowMs: 60 * 1000, max: 10, keyPrefix: "rl:upload" },

  // Public endpoints - moderate
  public: { windowMs: 60 * 1000, max: 60, keyPrefix: "rl:public" },

  // Webhooks - relaxed (trusted sources)
  webhook: { windowMs: 60 * 1000, max: 500, keyPrefix: "rl:webhook" },
};

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>,
  config: Partial<RateLimitConfig> = RATE_LIMITS.api
) {
  return async (request: T): Promise<NextResponse> => {
    const key = getRateLimitKey(request);
    const result = await checkRateLimit(key, config);

    if (!result.success) {
      return rateLimitResponse(result);
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.reset.toString());

    return response;
  };
}

/**
 * Check rate limit and return error response if exceeded
 * Use this in routes that need custom handling
 */
export async function enforceRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = RATE_LIMITS.api
): Promise<NextResponse | null> {
  const key = getRateLimitKey(request);
  const result = await checkRateLimit(key, config);

  if (!result.success) {
    return rateLimitResponse(result);
  }

  return null; // Rate limit not exceeded
}
