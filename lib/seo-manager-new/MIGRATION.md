# SEO Manager Migration Guide

This document outlines the migration process from the scattered SEO utilities to the new centralized SEO Manager.

## Migration Overview

The SEO-related code in the CourseAI project has been centralized into a single, well-organized directory (`lib/seo-manager-new`). This refactoring has consolidated code that was previously spread across multiple locations:

- `lib/seo.ts`
- `lib/schema.ts`
- `lib/social-image.ts`
- `app/schema/components/*`
- `app/utils/seo-helpers.ts`
- `app/utils/seo-schemas.tsx`

## Migration Steps Completed

1. ✅ Created centralized directory structure in `lib/seo-manager/`
2. ✅ Organized code into logical modules:
   - `config.ts`: Default values and configuration
   - `helper-utils.ts`: Utility functions
   - `meta-generators.ts`: Next.js metadata generators
   - `social-image.ts`: Social media image generation
   - `structured-data/`: Schema.org JSON-LD components and generators
   - `seo-components.tsx`: Ready-to-use SEO components
3. ✅ Created re-export wrappers in `lib/seo-manager-new/`
4. ✅ Updated imports across the codebase:
   - Updated imports from `@/lib/seo` to `@/lib/seo-manager-new`
   - Updated imports from `@/app/schema/components` to `@/lib/seo-manager-new`
   - Updated imports from `@/app/utils/seo-schemas` to `@/lib/seo-manager-new`
5. ✅ Provided backward compatibility through legacy files marked as deprecated
6. ✅ Fixed TypeScript errors and parameter mismatches

## Files Updated

The migration updated imports in the following key files:

- `app/layout.tsx` (Updated to use `DefaultSEO` component)
- `app/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/contactus/page.tsx`
- `app/dashboard/subscription/page.tsx`
- `app/dashboard/explore/page.tsx`
- `app/dashboard/(quiz)/quizzes/page.tsx`
- `app/dashboard/course/[slug]/page.tsx`
- `app/dashboard/(quiz)/flashcard/components/FlashcardQuizWrapper.tsx`
- `app/dashboard/(quiz)/components/layouts/QuizPlayLayout.tsx`
- `not-found.tsx`
- `lib/schema-registry.ts`
- `components/ui/optimized-image.tsx`
- `app/examples/seo-structured-data/page.tsx`

## Future Steps

1. Remove the deprecated compatibility layers after a suitable transition period
2. Further consolidate any remaining SEO-related utilities
3. Improve testing and documentation for SEO components

## Benefits

This migration provides several benefits:

- **Improved organization**: All SEO-related code is now in a single location
- **Better maintainability**: Easier to update and extend SEO functionality
- **Reduced duplication**: Consolidated overlapping functions and components
- **Clearer API**: Well-documented and typed exports
- **Better separation of concerns**: Structured data separate from metadata generation

## For Developers

When implementing SEO for new pages or components:

1. Always import from `@/lib/seo-manager-new`
2. Use the `DefaultSEO` component for basic SEO setup
3. Use specific schema components (e.g., `CourseSchema`, `QuizSchema`) for structured data
4. Use metadata generators for page metadata
