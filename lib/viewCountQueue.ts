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
    this.queue.set(slug, (this.queue.get(slug) || 0) + 1)
    this.cache.set(slug, (this.cache.get(slug) || 0) + 1)
  }

  async getViewCount(slug: string): Promise<number> {
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
    const batchUpdates = new Map(Array.from(this.queue).slice(0, this.batchSize))

    // Remove processed items from the queue
    for (const slug of batchUpdates.keys()) {
      this.queue.delete(slug)
    }

    try {
      // Debugging: Log batch updates
      console.log("Processing batch:", batchUpdates)

      await prisma.$transaction(
        Array.from(batchUpdates).map(([slug, increment]) =>
          prisma.course.update({
            where: { slug },
            data: { viewCount: { increment } },
          })
        )
      )

      console.log(`Processed ${batchUpdates.size} view count updates`)
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
}

export const viewCountQueue = new ViewCountQueue()
