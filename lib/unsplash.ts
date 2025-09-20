// Lightweight in-memory cache to avoid repeated network calls or placeholder loops
const unsplashCache: Record<string, string> = {}

// Prefer existing bundled placeholder assets to eliminate 404 spam.
// Public assets confirmed present: /images/placeholder.jpg, /images/default-thumbnail.png
const FALLBACK_PRIMARY = "/images/placeholder.jpg"
const FALLBACK_SECONDARY = "/images/default-thumbnail.png"

// Existing course images to use instead of external API calls
const EXISTING_IMAGES = {
  default: "/generic-course-improved.svg",
  tech: "/generic-course-tech-improved.svg",
  programming: "/generic-course-tech-improved.svg",
  "web-development": "/generic-course-tech-improved.svg",
  "data-science": "/generic-course-tech-improved.svg",
  business: "/generic-course-business-improved.svg",
  marketing: "/generic-course-business-improved.svg",
  design: "/generic-course-creative-improved.svg",
  creative: "/generic-course-creative-improved.svg",
  ai: "/generic-course-tech-improved.svg",
  cloud: "/generic-course-tech-improved.svg",
  mobile: "/generic-course-tech-improved.svg",
  security: "/generic-course-tech-improved.svg",
}

export const getUnsplashImage = async (query: string): Promise<string> => {
  const key = (query || '').trim().toLowerCase()
  if (!key) return EXISTING_IMAGES.default

  // Check cache first
  if (unsplashCache[key]) return unsplashCache[key]

  // Use existing images instead of making API calls
  // Map query keywords to existing images
  const normalizedQuery = key.toLowerCase()

  let selectedImage = EXISTING_IMAGES.default

  if (normalizedQuery.includes('programming') || normalizedQuery.includes('code') || normalizedQuery.includes('developer')) {
    selectedImage = EXISTING_IMAGES.tech
  } else if (normalizedQuery.includes('business') || normalizedQuery.includes('marketing') || normalizedQuery.includes('finance')) {
    selectedImage = EXISTING_IMAGES.business
  } else if (normalizedQuery.includes('design') || normalizedQuery.includes('creative') || normalizedQuery.includes('art')) {
    selectedImage = EXISTING_IMAGES.design
  } else if (normalizedQuery.includes('data') || normalizedQuery.includes('science') || normalizedQuery.includes('analytics')) {
    selectedImage = EXISTING_IMAGES.tech
  } else if (normalizedQuery.includes('ai') || normalizedQuery.includes('machine') || normalizedQuery.includes('learning')) {
    selectedImage = EXISTING_IMAGES.tech
  }

  // Cache the result
  unsplashCache[key] = selectedImage
  return selectedImage
}
