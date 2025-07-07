# Route Restructuring

This PR merges the `/dashboard/create` and `/dashboard/course` routes into a single `/dashboard/course` route structure.

## Changes

1. Created a unified course service in `/app/dashboard/course/services/unified-course-service.ts`
2. Moved course creation functionality to `/app/dashboard/course/create/`
3. Configured redirects from old paths to new paths in `next.config.mjs`
4. Updated import paths in relevant components
5. Updated URL references in UI components

## Benefits

- More logical organization of course-related features
- Consolidated service APIs
- Better code reusability
- Improved URL structure for SEO

## Migration Notes

If you have any code that relies on the old `/dashboard/create` path, it will be automatically redirected to `/dashboard/course/create`.

The following changes were made:
- `/dashboard/create` → `/dashboard/course/create`
- `/dashboard/create/:slug` → `/dashboard/course/create/:slug`

All course-related functionality is now under the `/dashboard/course` path for better organization.
