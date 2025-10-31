/**
 * CourseAI SEO Utilities
 * Performance-optimized utility functions for SEO operations
 */

import { LRUCache } from 'lru-cache'

// ============================================================================
// CACHING SYSTEM
// ============================================================================

const metadataCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
})

const schemaCache = new LRUCache<string, any>({
  max: 50,
  ttl: 1000 * 60 * 10, // 10 minutes
})

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

/**
 * Extract SEO-friendly keywords from text content
 */
export function extractKeywords(
  content: string,
  options: {
    limit?: number
    minLength?: number
    maxLength?: number
    excludeStopWords?: boolean
  } = {}
): string[] {
  const {
    limit = 10,
    minLength = 3,
    maxLength = 20,
    excludeStopWords = true,
  } = options

  // Stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'of', 'that', 'this', 'these', 'those',
    'it', 'its', 'they', 'them', 'their', 'there', 'where', 'when', 'why', 'how', 'what', 'which',
    'who', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'have', 'has', 'had',
    'do', 'does', 'did', 'get', 'got', 'go', 'goes', 'went', 'come', 'came', 'see', 'saw', 'know',
    'think', 'say', 'said', 'tell', 'give', 'take', 'make', 'use', 'find', 'work', 'call', 'try',
    'need', 'feel', 'become', 'keep', 'let', 'begin', 'help', 'show', 'play', 'move', 'live'
  ])

  // Process text
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => {
      if (word.length < minLength || word.length > maxLength) return false
      if (excludeStopWords && stopWords.has(word)) return false
      if (!isNaN(Number(word))) return false
      return /^[a-zA-Z]/.test(word)
    })

  // Calculate word frequency
  const wordFreq: Record<string, number> = {}
  words.forEach((word, index) => {
    const weight = index < words.length * 0.1 ? 2 : 1 // Early words get more weight
    wordFreq[word] = (wordFreq[word] || 0) + weight
  })

  // Sort by frequency and return top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word)
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(
  content: string,
  options: {
    maxLength?: number
    fallback?: string
  } = {}
): string {
  const { maxLength = 160, fallback = '' } = options

  if (!content) return fallback

  // Clean and truncate content
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  // Find a good break point
  const truncated = cleanContent.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace)
  }

  return truncated
}

/**
 * Generate social image URL with text overlay
 */
export function generateSocialImageUrl(
  text: string,
  options: {
    template?: string
    width?: number
    height?: number
    backgroundColor?: string
    textColor?: string
  } = {}
): string {
  const {
    template = 'default',
    width = 1200,
    height = 630,
    backgroundColor = '1e293b',
    textColor = 'ffffff',
  } = options

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io'
  const encodedText = encodeURIComponent(text)

  return `${baseUrl}/api/og?title=${encodedText}&width=${width}&height=${height}&bg=${backgroundColor}&color=${textColor}&template=${template}`
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase())
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate image dimensions and URL
 */
export function validateImage(image: {
  url: string
  width?: number
  height?: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isValidUrl(image.url)) {
    errors.push('Invalid image URL')
  }

  if (image.width && image.width < 200) {
    errors.push('Image width must be at least 200px')
  }

  if (image.height && image.height < 200) {
    errors.push('Image height must be at least 200px')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if SEO config has all required fields
 */
export function hasRequiredSEOFields(config: Record<string, any>): boolean {
  return Boolean(
    config.title &&
    config.description &&
    config.url &&
    typeof config.title === 'string' &&
    typeof config.description === 'string' &&
    typeof config.url === 'string'
  )
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Cache metadata generation results
 */
export function cacheMetadata(key: string, data: any): void {
  metadataCache.set(key, data)
}

/**
 * Get cached metadata
 */
export function getCachedMetadata(key: string): any | undefined {
  return metadataCache.get(key)
}

/**
 * Cache schema generation results
 */
export function cacheSchema(key: string, schema: any): void {
  schemaCache.set(key, schema)
}

/**
 * Get cached schema
 */
export function getCachedSchema(key: string): any | undefined {
  return schemaCache.get(key)
}

/**
 * Generate cache key for metadata
 */
export function generateMetadataCacheKey(config: Record<string, any>): string {
  const relevantFields = ['title', 'description', 'url', 'type', 'image']
  const keyData = relevantFields.reduce((acc, field) => {
    if (config[field]) {
      acc[field] = config[field]
    }
    return acc
  }, {} as Record<string, any>)

  return `metadata:${JSON.stringify(keyData)}`
}

/**
 * Generate cache key for schema
 */
export function generateSchemaCacheKey(type: string, data: Record<string, any>): string {
  return `schema:${type}:${JSON.stringify(data)}`
}

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

/**
 * Track SEO performance metrics
 */
export function trackSEOMetrics(
  page: string,
  metrics: {
    titleLength?: number
    descriptionLength?: number
    hasImage?: boolean
    hasSchema?: boolean
    loadTime?: number
  }
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SEO Metrics] ${page}:`, metrics)
  }

  // In production, you could send to analytics service
  // analytics.track('seo_metrics', { page, ...metrics })
}

/**
 * Validate SEO best practices
 */
export function validateSEOPractices(config: Record<string, any>): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  // Title validation
  if (!config.title) {
    issues.push('Missing title')
    score -= 20
  } else if (config.title.length < 30) {
    issues.push('Title too short (< 30 characters)')
    recommendations.push('Expand title to 30-60 characters')
    score -= 10
  } else if (config.title.length > 60) {
    issues.push('Title too long (> 60 characters)')
    recommendations.push('Shorten title to under 60 characters')
    score -= 10
  }

  // Description validation
  if (!config.description) {
    issues.push('Missing description')
    score -= 20
  } else if (config.description.length < 120) {
    issues.push('Description too short (< 120 characters)')
    recommendations.push('Expand description to 120-160 characters')
    score -= 10
  } else if (config.description.length > 160) {
    issues.push('Description too long (> 160 characters)')
    recommendations.push('Shorten description to under 160 characters')
    score -= 10
  }

  // Image validation
  if (!config.image) {
    issues.push('Missing social image')
    recommendations.push('Add Open Graph image (1200x630px)')
    score -= 15
  }

  // URL validation
  if (!config.url) {
    issues.push('Missing canonical URL')
    score -= 10
  }

  return { score, issues, recommendations }
}