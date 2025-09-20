/**
 * Navigation utility functions for quiz paths
 */

/**
 * Ensures slug is used in URLs instead of numeric IDs
 * This function will handle converting numeric IDs to proper slugs if available
 */
export const getNormalizedQuizPath = (
  quizType: string,
  slugOrId: string | number | null | undefined,
  segment: string = ''
): string => {
  if (!slugOrId) return '/dashboard/quizzes';
  
  // Always convert to string and ensure it's not just whitespace
  const safeSlug = String(slugOrId).trim();
  if (!safeSlug) return '/dashboard/quizzes';
  
  // Build the path with the provided segment
  const pathSegment = segment ? `/${segment}` : '';
  return `/dashboard/${quizType}/${safeSlug}${pathSegment}`;
};

/**
 * Redirect from numeric ID to slug if possible
 */
export const redirectFromNumericId = async (
  router: any, 
  currentSlugOrId: string,
  quizType: string = 'mcq',
  segment: string = ''
): Promise<boolean> => {
  // Only attempt redirect if the current path is numeric
  if (!/^\d+$/.test(currentSlugOrId)) return false;
  
  // Try to find a proper slug from session storage
  if (typeof window !== 'undefined') {
    try {
      // Check for any pending quiz with a different slug
      const pendingQuizStr = sessionStorage.getItem('pendingQuiz');
      if (pendingQuizStr) {
        try {
          const pendingQuiz = JSON.parse(pendingQuizStr);
          if (pendingQuiz.slug && pendingQuiz.slug !== currentSlugOrId) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`Redirecting from numeric ID ${currentSlugOrId} to proper slug ${pendingQuiz.slug}`);
            }
            const path = getNormalizedQuizPath(quizType, pendingQuiz.slug, segment);
            router.replace(path);
            return true;
          }
        } catch (parseError) {
          console.error("Failed to parse pendingQuiz:", parseError);
        }
      }
      
      // Look for quiz results with a slug property
      const storedResults = sessionStorage.getItem(`quiz_results_${currentSlugOrId}`);
      if (storedResults) {
        try {
          const resultsData = JSON.parse(storedResults);
          if (resultsData.slug && resultsData.slug !== currentSlugOrId && !/^\d+$/.test(resultsData.slug)) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`Redirecting from numeric ID ${currentSlugOrId} to slug from results ${resultsData.slug}`);
            }
            const path = getNormalizedQuizPath(quizType, resultsData.slug, segment);
            router.replace(path);
            return true;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error accessing sessionStorage:", e);
      }
      return false;
    }
  }
  
  return false;
};

/**
 * Navigate to quiz results page
 */
export const navigateToQuizResults = (
  router: any,
  quizType: string,
  slug: string | number | null | undefined
): void => {
  const safeSlug = slug ? String(slug) : 'unknown';
  try {
    router.push(`/dashboard/${quizType}/${safeSlug}/results`);
  } catch (e) {
    console.error("Navigation error:", e);
  }
};

/**
 * Return a safe href for quiz links. When slugOrId is falsy, returns the quizzes list
 * to avoid generating links like /dashboard/quiz/undefined
 */
export const getSafeQuizHref = (
  quizType: string = 'quiz',
  slugOrId?: string | number | null
): string => {
  if (!slugOrId) return '/dashboard/quizzes';
  const safe = String(slugOrId).trim();
  if (!safe) return '/dashboard/quizzes';
  return `/dashboard/${quizType}/${safe}`;
};

/**
 * Build the most appropriate quiz href from available data.
 * Preference order:
 *  1) slug -> /dashboard/quiz/:slug
 *  2) type + id -> /dashboard/quizzes/:type/:id
 *  3) id -> /dashboard/quiz/:id
 *  4) fallback -> /dashboard/quizzes
 */
export const getBestQuizHref = (opts: { slug?: string | null | undefined; type?: string | null | undefined; id?: string | number | null | undefined }) => {
  const { slug, type, id } = opts || {};
  if (slug && String(slug).trim()) return getSafeQuizHref('quiz', slug);
  if (type && id) return `/dashboard/quizzes/${String(type)}/${String(id)}`;
  if (id) return getSafeQuizHref('quiz', id);
  return '/dashboard/quizzes';
};
