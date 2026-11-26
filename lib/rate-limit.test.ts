import { faker } from '@faker-js/faker';
import { describe, expect, it, vi } from 'vitest';

import { allowAll, clientKey, createRateLimiter, rateLimiterFromEnv } from './rate-limit';

describe('createRateLimiter', () => {
  it.each([true, false])('maps success=%s and passes the key through', async (success) => {
    // Arrange
    const key = faker.internet.ip();
    const reset = faker.date.soon().getTime();
    const backend = { limit: vi.fn(async () => ({ success, reset })) };

    // Act
    const result = await createRateLimiter(backend)(key);

    // Assert
    expect(result).toEqual({ allowed: success, resetAt: reset });
    expect(backend.limit).toHaveBeenCalledExactlyOnceWith(key);
  });
});

describe('rateLimiterFromEnv', () => {
  it.each([
    ['no credentials', {}],
    ['a URL without a token', { KV_REST_API_URL: faker.internet.url() }],
    ['a token without a URL', { UPSTASH_REDIS_REST_TOKEN: faker.string.alphanumeric(32) }],
  ])('allows everything with %s', async (_name, env) => {
    // Act
    const limiter = rateLimiterFromEnv(env);

    // Assert
    expect(limiter).toBe(allowAll);
    expect(await limiter(faker.internet.ip())).toEqual({ allowed: true, resetAt: 0 });
  });

  it.each([
    ['Vercel integration names', 'KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['manual Upstash names', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ])('builds a real limiter from %s', (_name, urlName, tokenName) => {
    // Arrange
    const env = { [urlName]: faker.internet.url(), [tokenName]: faker.string.alphanumeric(32) };

    // Act
    const limiter = rateLimiterFromEnv(env);

    // Assert
    expect(limiter).not.toBe(allowAll);
  });
});

describe('clientKey', () => {
  it('prefers x-real-ip', () => {
    // Arrange
    const ip = faker.internet.ip();
    const headers = new Headers({ 'x-real-ip': ip, 'x-forwarded-for': faker.internet.ip() });

    // Act
    const key = clientKey(headers);

    // Assert
    expect(key).toBe(ip);
  });

  it('falls back to the first x-forwarded-for entry', () => {
    // Arrange
    const ip = faker.internet.ip();
    const headers = new Headers({ 'x-forwarded-for': ` ${ip} , ${faker.internet.ip()}` });

    // Act
    const key = clientKey(headers);

    // Assert
    expect(key).toBe(ip);
  });

  it.each([
    ['no headers', {}],
    ['blank headers', { 'x-real-ip': ' ', 'x-forwarded-for': ' ' }],
  ])('uses one shared anonymous key with %s', (_name, init) => {
    // Act
    const key = clientKey(new Headers(init));

    // Assert
    expect(key).toBe('anonymous');
  });
});
