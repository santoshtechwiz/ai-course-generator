import NodeCache from "node-cache"

// Create a singleton cache instance
const globalCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone objects for better performance
  deleteOnExpire: true, // Automatically delete expired items
})

/**
 * Cache utility for the application
 */
export class CacheService {
  private static instance: CacheService
  private cache: NodeCache
  private namespace: string

  private constructor(namespace = "") {
    this.cache = globalCache
    this.namespace = namespace ? `${namespace}:` : ""
  }

  /**
   * Get a cache service instance with an optional namespace
   * @param namespace Optional namespace to prefix keys
   * @returns CacheService instance
   */
  public static getInstance(namespace?: string): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(namespace)
    }
    return CacheService.instance
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined
   */
  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(`${this.namespace}${key}`)
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Optional TTL in seconds
   * @returns True if successful
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(`${this.namespace}${key}`, value, ttl)
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   * @returns True if successful
   */
  public del(key: string): number {
    return this.cache.del(`${this.namespace}${key}`)
  }

  /**
   * Get a value from the cache or compute it if not present
   * @param key The cache key
   * @param producer Function to produce the value if not in cache
   * @param ttl Optional TTL in seconds
   * @returns The cached or computed value
   */
  public async getOrSet<T>(key: string, producer: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key)
    if (cachedValue !== undefined) {
      return cachedValue
    }

    const value = await producer()
    this.set(key, value, ttl)
    return value
  }

  /**
   * Invalidate all cache entries with a specific prefix
   * @param prefix The prefix to match
   * @returns Number of keys deleted
   */
  public invalidateByPrefix(prefix: string): number {
    const fullPrefix = `${this.namespace}${prefix}`
    const keys = this.cache.keys().filter((key) => key.startsWith(fullPrefix))
    return this.cache.del(keys)
  }

  /**
   * Flush all cache entries in this namespace
   * @returns Number of keys deleted
   */
  public flush(): number {
    if (!this.namespace) {
      return 0 // Don't flush everything if no namespace
    }

    const keys = this.cache.keys().filter((key) => key.startsWith(this.namespace))
    return this.cache.del(keys)
  }
}

// Export default instances for common namespaces
export const courseCache = CacheService.getInstance("course")
export const quizCache = CacheService.getInstance("quiz")
export const userCache = CacheService.getInstance("user")
export const generalCache = CacheService.getInstance()
