Define the task to achieve, including specific requirements, constraints, and success criteria.

Task Definition:
- Review and refactor all API routes and Prisma queries in the CourseAI project.
- Add a robust database health check endpoint to verify the DB is online (without exposing credentials).
- Detect and fix duplicate API calls across the app, ensuring data is only fetched when necessary.
- Optimize Course and Quiz modules for performance:
  - Reduce overfetching and N+1 queries.
  - Use caching (React Query / TanStack Query / Next.js caching) where appropriate.
  - Apply ISR/SSG for static data where possible.
- Ensure React Suspense and global loader logic is stable and deterministic.

Constraints:
- Must **not break any existing functionality** — all current features must continue working.
- Database credentials and sensitive information must not be exposed.
- Changes must be compatible with Next.js App Router and Prisma best practices.



 GET /api/progress/21 200 in 91209ms
 GET /api/course/status/azure-blob 200 in 91848ms
 GET /api/recommendations/related-courses?courseId=21&limit=5 200 in 91981ms        
 GET /api/course/status/azure-blob 200 in 72088ms
 GET /dashboard/course/azure-blob 200 in 70650ms
 GET /dashboard/course/azure-blob 200 in 38146ms
 ○ Compiling /dashboard/subscription ...
 ✓ Compiled /dashboard/subscription in 36.4s (5239 modules)
 GET /dashboard/subscription 200 in 27397ms
 GET /api/progress/21 200 in 28024ms
 GET /api/course/status/azure-blob 200 in 28419ms
redux-persist failed to create sync storage. falling back to noop storage.
 GET /api/course/status/azure-blob 200 in 9388ms
 GET /dashboard/subscription 200 in 1967ms
 GET /api/recommendations/related-courses?courseId=21&limit=5 200 in 29838ms        
 GET /dashboard/subscription 200 in 30070ms


 TypeError: Cannot read properties of undefined (reading 'split')
    at CourseCard.useMemo (webpack-internal:///(app-pages-browser)/./


    
Success Criteria:
- Database health check endpoint returns online/offline status correctly.
- Duplicate API calls are eliminated, reducing redundant network requests.
- Course and Quiz modules render faster, with fewer server requests.
- Global loader and Suspense fallbacks work reliably without causing blank pages.
- Existing features (header/footer, navigation, course playback, quizzes) continue to work flawlessly.
- PR is clean, well-structured, and can be merged without regressions.