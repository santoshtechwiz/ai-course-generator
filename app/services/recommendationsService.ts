// Service for fetching recommendations from API
export interface PersonalizedRecommendation {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
  matchReason?: string;
}

// Simple in-memory cache
const recommendationsCache: Record<string, PersonalizedRecommendation[]> = {};

export async function fetchPersonalizedRecommendations(courseId: string | number, limit: number): Promise<PersonalizedRecommendation[]> {
  const cacheKey = `${courseId}:${limit}`;
  if (recommendationsCache[cacheKey]) {
    return recommendationsCache[cacheKey];
  }
  try {
    const url = `/api/recommendations/personalized?courseId=${courseId}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      // Silent error, log warning
      console.warn('Failed to fetch personalized recommendations');
      return [];
    }
    const data = await res.json();
    const result = data.data || [];
    recommendationsCache[cacheKey] = result;
    return result;
  } catch (err) {
    // Silent error, log warning
    console.warn('Failed to fetch personalized recommendations', err);
    return [];
  }
}
