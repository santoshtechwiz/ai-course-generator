import prisma from "@/lib/db"

class ViewCountQueue {
  private queue: Map<string, number> = new Map()
  private cache: Map<string, number> = new Map()
  private isProcessing = false
  private updateInterval: number = 60 * 1000 // 1 minute
  private batchSize = 10 // Process 10 records at a time

  constructor() {
    setInterval(() => this.processQueue(), this.updateInterval)
  }

  increment(slug: string): void {
    // Only increment if slug is provided
    if (!slug) return
    
    this.queue.set(slug, (this.queue.get(slug) || 0) + 1)
    this.cache.set(slug, (this.cache.get(slug) || 0) + 1)
  }

  async getViewCount(slug: string): Promise<number> {
    if (!slug) return 0
    
    if (this.cache.has(slug)) {
      return this.cache.get(slug)!
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      select: { viewCount: true },
    })

    const viewCount = course?.viewCount || 0
    this.cache.set(slug, viewCount)
    return viewCount
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) return

    this.isProcessing = true
    const batchEntries = Array.from(this.queue).slice(0, this.batchSize)
    const batchUpdates = new Map(batchEntries)

    // Remove processed items from the queue
    for (const slug of batchUpdates.keys()) {
      this.queue.delete(slug)
    }

    try {
      // First, verify which courses actually exist
      const slugs = Array.from(batchUpdates.keys())
      const existingCourses = await prisma.course.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      })
      
      const existingSlugs = new Set(existingCourses.map(course => course.slug))
      
      // Log which slugs don't exist
      const nonExistentSlugs = slugs.filter(slug => !existingSlugs.has(slug))
      if (nonExistentSlugs.length > 0) {
        console.warn(`Skipping updates for non-existent courses: ${nonExistentSlugs.join(', ')}`)
      }
      
      // Only update courses that exist
      if (existingSlugs.size > 0) {
        await prisma.$transaction(
          Array.from(batchUpdates)
            .filter(([slug]) => existingSlugs.has(slug))
            .map(([slug, increment]) =>
              prisma.course.update({
                where: { slug },
                data: { viewCount: { increment } },
              })
            )
        )
        
        console.log(`Processed ${existingSlugs.size} view count updates`)
      }
    } catch (error) {
      console.error("Error processing view count queue:", error)

      // Re-add failed updates to the queue
      for (const [slug, increment] of batchUpdates) {
        this.queue.set(slug, (this.queue.get(slug) || 0) + increment)
      }
    } finally {
      this.isProcessing = false
    }

    // If there are more items in the queue, process them after a short delay
    if (this.queue.size > 0) {
      setTimeout(() => this.processQueue(), 1000)
    }
  }
  
  // Method to clear invalid entries (for maintenance)
  async clearInvalidEntries(): Promise<void> {
    const slugs = Array.from(this.queue.keys())
    if (slugs.length === 0) return
    
    const existingCourses = await prisma.course.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    })
    
    const existingSlugs = new Set(existingCourses.map(course => course.slug))
    
    // Remove non-existent slugs from queue and cache
    for (const slug of slugs) {
      if (!existingSlugs.has(slug)) {
        this.queue.delete(slug)
        this.cache.delete(slug)
        console.log(`Removed invalid slug from queue: ${slug}`)
      }
    }
  }
}

export const viewCountQueue = new ViewCountQueue()
