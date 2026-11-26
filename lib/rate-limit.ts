import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** 20 chat requests per IP per 10 minutes: about 10 battles, since a clarification costs 2. */
export const RATE_LIMIT_REQUESTS = 20;
export const RATE_LIMIT_WINDOW = '10 m';

/** Keeps this app's keys apart when the Redis database is shared with other projects. */
export const RATE_LIMIT_PREFIX = 'battle-arena:ratelimit';

/** Fail open quickly: if Redis is slow or down, the demo keeps working instead of hanging. */
const REDIS_TIMEOUT_MS = 1000;

const ANONYMOUS_CLIENT = 'anonymous';

export interface RateLimitResult {
  allowed: boolean;
  /** Epoch milliseconds when the window frees up again; 0 when nothing is limited. */
  resetAt: number;
}

export type RateLimiter = (key: string) => Promise<RateLimitResult>;

/** The slice of @upstash/ratelimit this module relies on, so tests can pass a fake. */
export interface LimitBackend {
  limit: (key: string) => Promise<{ success: boolean; reset: number }>;
}

export const allowAll: RateLimiter = async () => ({ allowed: true, resetAt: 0 });

export const createRateLimiter =
  (backend: LimitBackend): RateLimiter =>
  async (key) => {
    const { success, reset } = await backend.limit(key);
    return { allowed: success, resetAt: reset };
  };

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Upstash limiter when credentials exist (the Vercel integration provides KV_REST_API_*,
 * a manual setup UPSTASH_REDIS_REST_*), otherwise no limit, e.g. in local development.
 */
export const rateLimiterFromEnv = (env: Env = process.env): RateLimiter => {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return allowAll;

  return createRateLimiter(
    new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW),
      prefix: RATE_LIMIT_PREFIX,
      timeout: REDIS_TIMEOUT_MS,
      analytics: false,
    }),
  );
};

/**
 * The client's IP as the limit key. On Vercel, x-real-ip and x-forwarded-for are set by the
 * platform from the connection, so clients cannot spoof them; the first forwarded entry is
 * the original client.
 */
export const clientKey = (headers: Headers): string => {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || ANONYMOUS_CLIENT;
};
