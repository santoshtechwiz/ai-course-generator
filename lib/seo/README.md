# CourseAI SEO System

A unified, enterprise-grade SEO management system for the CourseAI platform.

## Features

- ✅ **Single Source of Truth** - Centralized SEO configuration and metadata generation
- ✅ **Type Safety** - Full TypeScript support with comprehensive validation
- ✅ **Performance Optimized** - LRU caching for metadata and schema generation
- ✅ **Extensible Schema System** - Support for all major structured data types
- ✅ **Validation & Error Handling** - Built-in validation with helpful error messages
- ✅ **Developer Experience** - Clean API with excellent DX

## Quick Start

### Basic Usage

```tsx
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'My Page Title',
  description: 'Page description under 160 characters',
  url: 'https://courseai.io/my-page',
})
```

### Advanced Usage with Service

```tsx
import { createSEOService } from '@/lib/seo'

const seoService = createSEOService({
  title: 'CourseAI',
  description: 'AI-powered educational platform',
  url: 'https://courseai.io',
  openGraph: { siteName: 'CourseAI' },
  twitter: { site: '@courseai' },
})

// Generate metadata for a page
const metadata = seoService.generateMetadata({
  title: 'Advanced Course',
  description: 'Learn advanced topics with AI assistance',
  type: 'article',
})
```

### Page-Specific Configurations

```tsx
import { getPageConfig } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(
  getPageConfig('features', {
    // Override specific fields
    title: 'Custom Features Title',
  })
)
```

## API Reference

### Core Functions

#### `generateSEOMetadata(config: SEOConfig): Metadata`

Generates complete Next.js metadata object from configuration.

#### `createSEOService(baseConfig: SEOConfig): CourseAISEO`

Creates a reusable SEO service instance with base configuration.

### Configuration Helpers

#### `getPageConfig(pageKey: string, overrides?: Partial<SEOConfig>): SEOConfig`

Gets pre-configured SEO settings for standard pages.

Available page keys: `'home' | 'features' | 'pricing' | 'about' | 'contact' | 'privacy' | 'terms' | 'dashboard' | 'course' | 'quiz'`

#### `getCoursePageConfig(course: CourseData): SEOConfig`

Generates SEO config for dynamic course pages.

#### `getQuizPageConfig(quiz: QuizData): SEOConfig`

Generates SEO config for dynamic quiz pages.

### Schema Components

```tsx
import { OrganizationSchema, CourseSchema, FAQSchema } from '@/lib/seo'

// Organization schema (goes in layout or home page)
<OrganizationSchema />

// Course schema
<CourseSchema course={{
  name: 'React Fundamentals',
  description: 'Learn React from basics to advanced',
  instructor: 'John Doe',
  tags: ['react', 'javascript', 'frontend'],
  url: 'https://courseai.io/courses/react-fundamentals'
}} />

// FAQ schema
<FAQSchema faqs={[
  { question: 'What is CourseAI?', answer: 'CourseAI is...' },
  { question: 'How does it work?', answer: 'It works by...' }
]} />
```

### Utility Functions

```tsx
import {
  extractKeywords,
  generateMetaDescription,
  validateSEOPractices
} from '@/lib/seo'

// Extract keywords from content
const keywords = extractKeywords(content, { limit: 5 })

// Generate description
const description = generateMetaDescription(content)

// Validate SEO practices
const { score, issues, recommendations } = validateSEOPractices(config)
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://courseai.io
NEXT_PUBLIC_SITE_NAME=CourseAI
NEXT_PUBLIC_SITE_DESCRIPTION=AI-powered educational platform
NEXT_PUBLIC_TWITTER_HANDLE=@courseai
NEXT_PUBLIC_DEFAULT_LOCALE=en_US
```

### SEOConfig Interface

```typescript
interface SEOConfig {
  title: string                    // Required, max 60 chars
  description?: string            // Max 160 chars
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile' | 'product'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
  locale?: string
  alternates?: Record<string, string>
  structuredData?: Record<string, any>[]
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
  }
  openGraph?: {
    siteName?: string
    locale?: string
    type?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
}
```

## Migration Guide

### From Old System

**Before:**
```tsx
import { generateMetadata } from '@/lib/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Page Title',
  description: 'Description',
})
```

**After:**
```tsx
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Page Title',
  description: 'Description',
  url: 'https://courseai.io/page',
})
```

### Page-Specific Migration

**Before:**
```tsx
// Manual configuration
export const metadata: Metadata = {
  title: 'Features - CourseAI',
  description: 'Explore features...',
  // ... lots of manual config
}
```

**After:**
```tsx
import { getPageConfig, generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata(
  getPageConfig('features')
)
```

## Best Practices

### 1. Always Provide URLs
```tsx
// ✅ Good
generateSEOMetadata({
  title: 'My Page',
  description: 'Description',
  url: 'https://courseai.io/my-page', // Required for canonical URLs
})

// ❌ Bad - missing URL
generateSEOMetadata({
  title: 'My Page',
  description: 'Description',
})
```

### 2. Use Page Configurations
```tsx
// ✅ Good - consistent across app
export const metadata: Metadata = generateSEOMetadata(
  getPageConfig('features')
)

// ❌ Bad - inconsistent titles
export const metadata: Metadata = generateSEOMetadata({
  title: 'Features',
  description: 'Our features...',
})
```

### 3. Add Structured Data
```tsx
// ✅ Good - semantic markup
export default function CoursePage() {
  return (
    <>
      <CourseSchema course={courseData} />
      <ArticleSchema article={articleData} />
      {/* page content */}
    </>
  )
}
```

### 4. Validate in Development
```tsx
// Add to page components in development
if (process.env.NODE_ENV === 'development') {
  const { score, issues } = validateSEOPractices(config)
  if (issues.length > 0) {
    console.warn('SEO Issues:', issues)
  }
}
```

## Performance

- **LRU Caching**: Metadata and schema results are cached for 5-10 minutes
- **Memoization**: React components use memoization to prevent unnecessary re-renders
- **Lazy Loading**: Schema components only render when data is available

## Error Handling

The system includes comprehensive error handling:

- **Validation**: Configuration is validated with helpful error messages
- **Fallbacks**: Graceful degradation when optional fields are missing
- **Logging**: Development warnings for SEO issues
- **Type Safety**: Full TypeScript coverage prevents runtime errors

## Future Enhancements

- **AI-Powered SEO**: Automatic content analysis and optimization suggestions
- **A/B Testing**: SEO configuration testing and analytics
- **Internationalization**: Multi-language SEO support
- **Dynamic Sitemaps**: Automated sitemap generation from content
- **SEO Monitoring**: Real-time SEO performance tracking