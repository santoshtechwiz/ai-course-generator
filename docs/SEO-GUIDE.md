# SEO and Social Media Sharing Guide

This document outlines the standards and practices for SEO and social media sharing in the CourseAI platform.

## OG Images

The platform uses optimized OpenGraph images for social media sharing. These can be found in:

```
/public/images/og/courseai-og.svg  # Vector source file
/public/images/og/courseai-og.png  # Rendered PNG for social media
```

### Using OG Images

CourseAI provides a utility for consistent social media metadata across pages:

```typescript
import { generateSocialImage } from '@/lib/seo'

export const metadata = {
  title: 'Page Title',
  description: 'Page description',
  ...generateSocialImage({
    title: 'Social Media Title',
    description: 'Social media description',
    type: 'article' // 'website', 'article', 'profile', 'book'
  }) as any
}
```

## Default SEO Configuration

The default SEO settings are defined in `/lib/seo.ts`. These include:

- Title template structure
- Base description
- OpenGraph defaults
- Twitter card configuration
- Robots directives
- Favicon and alternate URLs

## Page-Specific SEO

For page-specific SEO, you can override the default metadata in the page file:

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  // Other metadata
}
```

## Best Practices

1. Always include unique titles and descriptions for each page
2. Keep titles under 60 characters and descriptions under 160 characters
3. Use the `generateSocialImage` utility for consistent social cards
4. Include relevant keywords in titles and descriptions
5. Use proper structural markup with heading tags (h1, h2, etc.)
6. Implement structured data where appropriate

## Creating New OG Images

When creating new OG images for courses or features:

1. Use the template in `/public/images/og/courseai-og.svg` as a starting point
2. Maintain the 1200x630 pixel dimension
3. Include the CourseAI logo/branding
4. Use the brand color palette
5. Save both SVG source and PNG export
6. Use descriptive filenames

## Testing Social Media Cards

You can test how your social cards appear using these tools:

- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
