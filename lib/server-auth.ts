import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

// Cache timing for server-side auth functions
const CACHE_TTL = 30 * 1000; // 30 seconds
const functionCache = new Map<string, {result: any, timestamp: number}>();

/**
 * Get the server-side session with proper typing and caching
 * 
 * @param options Optional configuration like skipCache
 * @returns The current session or null if not authenticated
 */
export async function getServerAuthSession(options?: { skipCache?: boolean }) {
  // Use the standard getServerSession for now
  return await getServerSession(authOptions)
}

/**
 * Check if the current user is authenticated server-side
 * 
 * @param options Optional configuration
 * @returns Boolean indicating if user is authenticated
 */
async function isAuthenticated(options?: { skipCache?: boolean }) {
  // Use cache for frequent calls to reduce DB load
  if (!options?.skipCache) {
    const cacheKey = 'isAuthenticated';
    const cached = functionCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return cached.result;
    }    
    // Not in cache or expired, get fresh result
    const session = await getServerAuthSession()
    const result = !!session?.user;
    functionCache.set(cacheKey, { result, timestamp: now });
    return result;
  }
  
  // Skip cache
  const session = await getServerAuthSession({ skipCache: true })
  return !!session?.user
}

/**
 * Check if the current user is an admin server-side
 * 
 * @param options Optional configuration 
 * @returns Boolean indicating if user is an admin
 */
async function isAdmin(options?: { skipCache?: boolean }) {
  // Use cache for frequent calls to reduce DB load
  if (!options?.skipCache) {
    const cacheKey = 'isAdmin';
    const cached = functionCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return cached.result;
    }
      // Not in cache or expired, get fresh result
    const session = await getServerAuthSession()
    const result = !!session?.user?.isAdmin;
    functionCache.set(cacheKey, { result, timestamp: now });
    return result;
  }
  
  // Skip cache
  const session = await getServerAuthSession({ skipCache: true })
  return !!session?.user?.isAdmin
}

/**
 * Get the current user's ID server-side
 * 
 * @param options Optional configuration
 * @returns The user ID or undefined if not authenticated
 */
async function getUserId(options?: { skipCache?: boolean }) {
  // This is often used as part of data fetching, so we use a shorter cache
  if (!options?.skipCache) {
    const cacheKey = 'getUserId';
    const cached = functionCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_TTL / 2)) { // Half the normal cache time
      return cached.result;
    }
      // Not in cache or expired, get fresh result
    const session = await getServerAuthSession()
    const result = session?.user?.id;
    functionCache.set(cacheKey, { result, timestamp: now });
    return result;
  }
  
  // Skip cache
  const session = await getServerAuthSession({ skipCache: true })
  return session?.user?.id
}
