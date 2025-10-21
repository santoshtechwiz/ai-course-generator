// Lightweight cached fetcher for course status
// - Coalesces concurrent requests per slug
// - Caches successful responses for a short TTL (default 8s)
// - Records 401 responses globally per slug and prevents further requests until cleared

type CacheEntry = {
  data: any
  expiresAt: number
}

const CACHE_TTL_MS = 8000 // 8 seconds

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<{ status: number; data?: any }>>()
const unauthorized = new Set<string>()
const unauthorizedNotified = new Set<string>()

async function getCourseStatus(slug: string, opts?: { force?: boolean }) {
  if (!slug) return { status: 400 }

  // If 401 previously observed for this slug, return quickly
  if (unauthorized.has(slug) && !opts?.force) {
    return { status: 401 }
  }

  const now = Date.now()
  const cached = cache.get(slug)
  if (cached && cached.expiresAt > now && !opts?.force) {
    return { status: 200, data: cached.data }
  }

  // If a request is already pending for this slug, return the same promise
  if (pending.has(slug) && !opts?.force) {
    return pending.get(slug)!
  }

  const p = (async () => {
    try {
      const res = await fetch(`/api/course/status/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (res.status === 401) {
        // mark unauthorized so we don't spam server with retries
        unauthorized.add(slug)
        return { status: 401 }
      }

      if (!res.ok) {
        // return non-200 status for callers to handle
        return { status: res.status }
      }

      const data = await res.json()
      cache.set(slug, { data, expiresAt: Date.now() + CACHE_TTL_MS })
      return { status: 200, data }
    } finally {
      // cleanup pending entry
      pending.delete(slug)
    }
  })()

  pending.set(slug, p)
  return p
}

function clearCourseStatusCache(slug?: string) {
  if (slug) cache.delete(slug)
  else cache.clear()
}

function clearUnauthorized(slug?: string) {
  if (slug) {
    unauthorized.delete(slug)
    unauthorizedNotified.delete(slug)
  } else {
    unauthorized.clear()
    unauthorizedNotified.clear()
  }
}

export function notifyUnauthorizedOnce(slug: string, cb: () => void) {
  if (!unauthorizedNotified.has(slug)) {
    unauthorizedNotified.add(slug)
    try { cb() } catch (e) { /* swallow */ }
  }
}

function isUnauthorized(slug: string) {
  return unauthorized.has(slug)
}

export default {
  getCourseStatus,
  clearCourseStatusCache,
  clearUnauthorized,
  notifyUnauthorizedOnce,
  isUnauthorized
}
