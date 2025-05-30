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
        const parsedQuiz = JSON.parse(pendingQuizStr);
        if (parsedQuiz.slug && parsedQuiz.slug !== currentSlugOrId) {
          console.log(`Redirecting from numeric ID ${currentSlugOrId} to proper slug ${parsedQuiz.slug}`);
          const path = getNormalizedQuizPath(quizType, parsedQuiz.slug, segment);
          router.replace(path);
          return true;
        }
      }
      
      // Look for quiz results with a slug property
      const storedResults = sessionStorage.getItem(`quiz_results_${currentSlugOrId}`);
      if (storedResults) {
        try {
          const resultsData = JSON.parse(storedResults);
          if (resultsData.slug && resultsData.slug !== currentSlugOrId && !/^\d+$/.test(resultsData.slug)) {
            console.log(`Redirecting from numeric ID ${currentSlugOrId} to slug from results ${resultsData.slug}`);
            const path = getNormalizedQuizPath(quizType, resultsData.slug, segment);
            router.replace(path);
            return true;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    } catch (e) {
      console.warn('Error while attempting slug redirect:', e);
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
  if (!slug) return;
  
  // Ensure slug is a string
  const safeSlug = String(slug).trim();
  if (!safeSlug) return;
  
  try {
    router.push(`/dashboard/${quizType}/${safeSlug}/results`);
  } catch (e) {
    console.error("Error navigating to results:", e);
    
    // Fallback to window.location if needed
    if (typeof window !== 'undefined') {
      window.location.href = `/dashboard/${quizType}/${safeSlug}/results`;
    }
  }
};
