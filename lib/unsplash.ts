// Lightweight in-memory cache to avoid repeated network calls or placeholder loops
const unsplashCache: Record<string, string> = {}

// Prefer existing bundled placeholder assets to eliminate 404 spam.
// Public assets confirmed present: /images/placeholder.jpg, /images/default-thumbnail.png
const FALLBACK_PRIMARY = "/images/placeholder.jpg"
const FALLBACK_SECONDARY = "/images/default-thumbnail.png"

export const getUnsplashImage = async (query: string) => {
  const key = (query || '').trim().toLowerCase()
  if (!key) return FALLBACK_PRIMARY
  if (unsplashCache[key]) return unsplashCache[key]

  // If no Unsplash key configured, short‑circuit with deterministic placeholder
  if (!process.env.UNSPLASH_API_KEY) {
    unsplashCache[key] = FALLBACK_PRIMARY
    return unsplashCache[key]
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const resp = await fetch(`https://api.unsplash.com/search/photos?per_page=1&content_filter=high&query=${encodeURIComponent(key)}&client_id=${process.env.UNSPLASH_API_KEY}`,
      { signal: controller.signal, headers: { 'Accept-Version': 'v1' } })
    clearTimeout(timeout)
    if (!resp.ok) throw new Error(`Unsplash ${resp.status}`)
    const data: any = await resp.json()
    const url: string | undefined = data?.results?.[0]?.urls?.small || data?.results?.[0]?.urls?.thumb
    if (!url) throw new Error('No image result')
    unsplashCache[key] = url
    return url
  } catch (error) {
    // Cache fallback to avoid retry storms
    const fallback = FALLBACK_PRIMARY
    unsplashCache[key] = fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[unsplash] fallback for "${key}":`, (error as Error)?.message)
    }
    return fallback || FALLBACK_SECONDARY
  }
}
