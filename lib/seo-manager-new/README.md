# SEO Manager

This is a centralized SEO management system for CourseAI that consolidates all SEO-related utilities, components, and helpers into a single location. **MIGRATION COMPLETE** ✅

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Features](#features)
4. [Usage](#usage)
   - [Metadata Generation](#metadata-generation)
   - [Structured Data](#structured-data)
   - [Social Media Cards](#social-media-cards)
   - [Helper Utilities](#helper-utilities)
5. [Examples](#examples)
6. [API Reference](#api-reference)

## Overview

The SEO Manager provides a single source of truth for all SEO-related functionality in the CourseAI application, including:

- Metadata generation for Next.js pages
- Structured data (JSON-LD) for schema.org
- OpenGraph and Twitter card support
- SEO helper utilities

## Installation

The SEO Manager is included as part of the CourseAI codebase. To use it, simply import the required functions and components from the module:

```typescript
import { generateMetadata, JsonLD } from '@/lib/seo-manager-new';
```

## Features

- **Unified metadata generation** - Generate consistent metadata for all pages
- **Schema.org structured data** - Add JSON-LD structured data to pages
- **Component-based approach** - Use React components for structured data
- **Functional API** - Generate structured data programmatically
- **Social media optimization** - Optimize content for social sharing

## Usage

### Metadata Generation

```typescript
import { generateMetadata } from '@/lib/seo-manager-new';
import type { Metadata } from 'next';

export const metadata: Metadata = generateMetadata({
  title: 'Page Title',
  description: 'Page description',
  keywords: ['keyword1', 'keyword2'],
  path: '/current/path',
  ogImage: '/path/to/image.jpg',
  ogType: 'website'
});
```

For specialized content types:

```typescript
import { generateCourseMetadata } from '@/lib/seo-manager-new';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await fetchCourse(params.slug);
  return generateCourseMetadata(course, params.slug);
}
```

### Structured Data

Using components (React):

```tsx
import { JsonLD, CourseSchema, BreadcrumbListSchema } from '@/lib/seo-manager';

export default function CoursePage({ course }) {
  return (
    <>
      <CourseSchema 
        name={course.title}
        description={course.description}
        url={`https://courseai.io/course/${course.slug}`}
        provider={{
          name: 'CourseAI',
          url: 'https://courseai.io'
        }}
        imageUrl={course.image}
      />
      
      <BreadcrumbListSchema items={breadcrumbs} />
      
      {/* Or using the generic JsonLD component */}
      <JsonLD 
        type="Course" 
        data={{
          name: course.title,
          description: course.description,
          // ...other data
        }} 
      />
    </>
  );
}
```

Using functional API (for server components):

```typescript
import { SchemaRegistry } from '@/lib/seo-manager';

const courseSchema = SchemaRegistry.Course({
  name: course.title,
  description: course.description,
  url: `https://courseai.io/course/${course.slug}`,
  // ... other data
});
```

### Social Media Cards

```typescript
import { generateSocialImage } from '@/lib/seo-manager';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    ...generateSocialImage({
      title: 'Page Title',
      description: 'Page description',
      imagePath: '/path/to/image.jpg',
      url: '/current/path',
      type: 'article'
    })
  };
}
```

### Helper Utilities

```typescript
import { 
  extractKeywords, 
  generateMetaDescription, 
  createBreadcrumbItems 
} from '@/lib/seo-manager';

// Extract keywords from content
const keywords = extractKeywords(pageContent, 10);

// Generate meta description
const description = generateMetaDescription(pageContent, 160);

// Create breadcrumb items
const breadcrumbs = createBreadcrumbItems([
  { name: 'Home', path: '/' },
  { name: 'Courses', path: '/courses' },
  { name: 'JavaScript', path: '/courses/javascript' }
]);
```

## Examples

### Basic Page SEO

```tsx
import { DefaultSEO } from '@/lib/seo-manager-new';

export default function Page() {
  return (
    <>
      <DefaultSEO currentPath="/courses/javascript" />
      {/* Page content */}
    </>
  );
}
```

### Course Page with Rich Structured Data

```tsx
import { 
  CombinedSEOSchema, 
  generateBreadcrumbs, 
  CourseSchema 
} from '@/lib/seo-manager-new';

export default function CoursePage({ course }) {
  const breadcrumbs = generateBreadcrumbs(`/courses/${course.slug}`);
  
  return (
    <>
      <CombinedSEOSchema 
        breadcrumbs={{ items: breadcrumbs }}
        organization={true}
      />
      
      <CourseSchema
        name={course.title}
        description={course.description}
        url={`https://courseai.io/courses/${course.slug}`}
        provider={{
          name: 'CourseAI',
          url: 'https://courseai.io'
        }}
        imageUrl={course.image}
        dateCreated={course.createdAt}
        dateModified={course.updatedAt}
        author={course.author ? {
          name: course.author.name,
          url: course.author.profileUrl
        } : undefined}
      />
      
      {/* Page content */}
    </>
  );
}
```

## API Reference

For a complete API reference, refer to the TypeScript definitions and JSDoc comments in the source code.

- `generateMetadata(options)`: Generate metadata for pages
- `JsonLD({ type, data })`: Add JSON-LD structured data
- `SchemaRegistry`: Access schema generators
- `DefaultSEO`: Add basic SEO for all pages
- ...and many more specialized components and utilities

## Migration Status

The migration to the centralized SEO manager is now complete. All imports across the codebase have been updated to use the new `@/lib/seo-manager-new` import path. This includes:

- ✅ Updated all imports from `@/lib/seo` to `@/lib/seo-manager-new`
- ✅ Updated all imports from `@/app/schema/components` to `@/lib/seo-manager-new`
- ✅ Updated all imports from `@/app/utils/seo-schemas` to `@/lib/seo-manager-new`
- ✅ Updated `DefaultSEO` component in `app/layout.tsx` to replace `SEOSchema` and `FAQSchema`
- ✅ Fixed TypeScript errors related to parameter types
- ✅ Updated documentation to reflect the new import paths

Legacy files are still available for backward compatibility but marked as deprecated:
- `@/lib/seo.ts`
- `@/lib/schema.ts`
- `@/lib/social-image.ts`

These will be removed in a future update after all direct references are migrated.
