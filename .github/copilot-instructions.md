# AI Learning Platform - Cleanup & Stabilization Instructions

## Goal
Stabilize the CourseAI platform by eliminating blank pages, fixing loaders, removing unused code, and enforcing consistency across the app.  
Follow these instructions for automated cleanup and long-term maintainability.

---

## 1. Blank Page Fixes
- Use **SWR + abort controllers** everywhere for data fetching.
- Wrap all dashboard/course/quiz components in **error boundaries with retry**.
- Replace `fetch(..., { cache: 'no-store' })` with **SWR caching** unless personalization is required.
- Ensure all `page.tsx` routes return a fallback UI while data is loading.

---

## 2. Loader Consistency
- Always use the **existing Loader component + NProgress**.
- Loader must:
  - Be **centered** using `flex` or `grid`.
  - Show a **contextual message** (e.g., “Loading quiz…”, “Fetching courses…”).
- Hook loader visibility into **SWR states**:  
  - `isLoading` → initial load  
  - `isValidating` → background refresh  

---

## 3. Unused Code Cleanup
1. Remove unused dependencies:
   ```bash
   npx depcheck
