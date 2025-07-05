# SEO Manager

The SEO Manager is a centralized module that provides tools for managing SEO across your application. This module includes metadata generation, Schema.org structured data, and SEO-related utilities.

## Features

- Metadata generation for Next.js pages
- Schema.org structured data (JSON-LD)
- React components for SEO
- Utilities for SEO optimization

## Usage

### Metadata Generation

```tsx
// In a page component
import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo-manager';

export const metadata: Metadata = generateMetadata({
  title: 'Page Title',
  description: 'Page description for SEO',
  path: '/page-path',
  keywords: ['keyword1', 'keyword2'],
  ogImage: '/path/to/og-image.jpg',
  ogType: 'website',
});
```

### For specialized page types:

```tsx
// For a quiz page
import { generateQuizMetadata } from '@/lib/seo-manager';

export const metadata = generateQuizMetadata(quizData, 'quiz-slug');

// For a course page
import { generateCourseMetadata } from '@/lib/seo-manager';

export const metadata = generateCourseMetadata(courseData, 'course-slug');
```

### Schema.org Structured Data

#### Using React Components

```tsx
import { 
  JsonLD, 
  WebsiteSchema, 
  OrganizationSchema,
  BreadcrumbListSchema,
  CombinedSEOSchema,
  DefaultSEO
} from '@/lib/seo-manager';

// Individual schema components
<WebsiteSchema 
  siteName="CourseAI"
  siteUrl="https://courseai.io"
  logoUrl="https://courseai.io/logo.png"
/>

// Combined schema for common use cases
<CombinedSEOSchema 
  website={true}
  breadcrumbs={{ items: breadcrumbItems }}
  organization={{
    sameAs: ['https://twitter.com/courseai']
  }}
  faq={{ items: faqItems }}
/>

// Default SEO setup (recommended for most pages)
<DefaultSEO currentPath={pathname} includeFAQ={true} />
```

#### Using Schema Generators

```tsx
import { 
  generateCourseSchema,
  generateFAQSchema,
  SchemaRegistry,
  schemaRegistry
} from '@/lib/seo-manager';

// Generate individual schemas
const courseSchema = generateCourseSchema(courseData);
const faqSchema = generateFAQSchema(faqItems);

// Use the schema registry for dynamic schema generation
const schema = schemaRegistry.generate('Course', courseData);
```

### Utility Functions

```tsx
import { 
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  generateSocialImage,
  createBreadcrumbItems,
  createSocialProfiles
} from '@/lib/seo-manager';

// Extract keywords from content
const keywords = extractKeywords(content, 5);

// Generate a meta description
const description = generateMetaDescription(content, 160);

// Optimize image alt text
const altText = optimizeImageAlt(rawAlt, 'Fallback text');

// Generate social media metadata
const socialMetadata = generateSocialImage({
  title: 'Page Title',
  description: 'Page description',
  imagePath: '/path/to/image.jpg'
});

// Create breadcrumb items for structured data
const breadcrumbs = createBreadcrumbItems([
  { name: 'Home', path: '/' },
  { name: 'Courses', path: '/courses' }
]);

// Create social media profile URLs
const profiles = createSocialProfiles({
  twitter: 'courseai',
  github: 'courseai'
});
```

## Module Structure

- `index.ts` - Main exports
- `types.ts` - Type definitions
- `constants.ts` - Default values and constants
- `metadata.ts` - Metadata generation functions
- `schema.ts` - Schema.org structured data generators
- `components.tsx` - React components for SEO
- `utils.ts` - Utility functions

## Best Practices

1. Use `DefaultSEO` component in your layout for consistent SEO across all pages
2. Generate metadata for each page using `generateMetadata` or specialized functions
3. Use appropriate schema.org structured data based on content type
4. Keep metadata titles under 60 characters and descriptions under 160 characters
5. Include relevant keywords naturally in titles and descriptions

## Migration Guide

If you were using the previous SEO utilities, here's how to migrate:

### Before:
```tsx
import { generateMetadata } from '@/lib/seo';
// or
import { generateSeoMetadata } from '@/lib/utils/seo-utils';
```

### After:
```tsx
import { generateMetadata } from '@/lib/seo-manager';
```

### Before:
```tsx
import { JsonLD } from '@/app/schema/components';
```

### After:
```tsx
import { JsonLD } from '@/lib/seo-manager';
```

### Before:
```tsx
import { WebsiteSchema } from '@/app/utils/seo-schemas';
```

### After:
```tsx
import { WebsiteSchema } from '@/lib/seo-manager';
```
