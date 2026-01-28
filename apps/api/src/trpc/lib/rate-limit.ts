/**
 * Simple in-memory rate limiter for API protection
 * For production, consider using Redis or Cloudflare's built-in rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (resets on worker restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Default configs for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Very restrictive for auth-related endpoints
  auth: {windowMs: 60_000, maxRequests: 5}, // 5 per minute
  // Restrictive for invites to prevent spam
  invites: {windowMs: 60_000, maxRequests: 10}, // 10 per minute
  // Standard for general API usage
  standard: {windowMs: 60_000, maxRequests: 100}, // 100 per minute
} as const

/**
 * Check if a request should be rate limited
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.standard,
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k)
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // Start new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return false
  }

  if (entry.count >= config.maxRequests) {
    return true // Rate limited
  }

  entry.count++
  return false
}

/**
 * Get rate limit key for user + action
 */
export function getRateLimitKey(userId: string, action: string): string {
  return `${userId}:${action}`
}
