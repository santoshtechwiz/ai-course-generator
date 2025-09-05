import { Subject, bufferTime, filter } from 'rxjs';

export interface ProgressUpdate {
  userId: string;
  courseId: number;
  chapterId: number;
  progress: number;
  timestamp: number;
  type: 'video' | 'quiz' | 'chapter';
  metadata?: Record<string, any>;
}

class ProgressQueue {
  private static instance: ProgressQueue;
  private progressSubject: Subject<ProgressUpdate>;
  private batchSize = 10;
  private bufferTimeMs = 3000; // Reduced to 3 seconds for responsiveness

  // Rate limiting properties (relaxed)
  private userRateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly MAX_UPDATES_PER_MINUTE = 100; // Increased limit
  private readonly RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

  // Circuit breaker properties
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private circuitOpen = false;
  private circuitResetTime = 0;
  private readonly CIRCUIT_BREAKER_TIMEOUT_MS = 60000; // 1 minute

  private constructor() {
    this.progressSubject = new Subject<ProgressUpdate>();
    this.setupProgressProcessor();
  }

  public static getInstance(): ProgressQueue {
    if (!ProgressQueue.instance) {
      ProgressQueue.instance = new ProgressQueue();
    }
    return ProgressQueue.instance;
  }

  private setupProgressProcessor() {
    this.progressSubject.pipe(
      bufferTime(this.bufferTimeMs),
      filter(updates => updates.length > 0)
    ).subscribe(async (updates) => {
      try {
        await this.processBatch(updates);
      } catch (error) {
        console.error('Error processing progress batch:', error);
      }
    });
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const key = userId;
    const limit = this.userRateLimits.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize rate limit window
      this.userRateLimits.set(key, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW_MS });
      return true;
    }

    if (limit.count >= this.MAX_UPDATES_PER_MINUTE) {
      console.warn(`Rate limit exceeded for user ${userId}. Limit: ${this.MAX_UPDATES_PER_MINUTE}/minute`);
      return false;
    }

    limit.count++;
    return true;
  }

  private async processBatch(updates: ProgressUpdate[]) {
    if (updates.length === 0) return;

    // Group updates by user and course
    const groupedUpdates = updates.reduce((acc, update) => {
      const key = `${update.userId}:${update.courseId}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(update);
      return acc;
    }, {} as Record<string, ProgressUpdate[]>);

    // Process each group
    const promises = Object.values(groupedUpdates).map(async (groupUpdates) => {
      // Take the latest update for each chapter and type combination
      const latestUpdates = new Map<string, ProgressUpdate>();
      groupUpdates.forEach(update => {
        const typeKey = `${update.chapterId}:${update.type}`;
        const existing = latestUpdates.get(typeKey);
        if (!existing || update.timestamp > existing.timestamp) {
          latestUpdates.set(typeKey, update);
        }
      });

      // Only send updates if there are meaningful changes
      const filteredUpdates = Array.from(latestUpdates.values()).filter(update => {
        // Skip updates with progress 0 unless it's a completion or specific metadata
        if (update.progress === 0 && !update.metadata?.completed && !update.metadata?.isFinal) {
          return false;
        }
        return true;
      });

      if (filteredUpdates.length > 0) {
        // Bulk update progress
        await this.bulkUpdateProgress(filteredUpdates);
      }
    });

    await Promise.all(promises);
  }

  private async bulkUpdateProgress(updates: ProgressUpdate[]) {
    if (updates.length === 0) return;

    // Check circuit breaker
    const now = Date.now();
    if (this.circuitOpen) {
      if (now < this.circuitResetTime) {
        console.warn('Circuit breaker open, skipping progress update');
        return;
      }
      // Reset circuit breaker
      this.circuitOpen = false;
      this.consecutiveFailures = 0;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('/api/progress/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success - reset consecutive failures
        this.consecutiveFailures = 0;
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        console.error(`Progress update attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    // All retries failed
    this.consecutiveFailures++;
    console.error('All progress update attempts failed:', lastError);

    // Open circuit breaker if too many consecutive failures
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.circuitOpen = true;
      this.circuitResetTime = now + this.CIRCUIT_BREAKER_TIMEOUT_MS;
      console.warn(`Circuit breaker opened due to ${this.consecutiveFailures} consecutive failures`);
    }

    throw lastError;
  }

  public enqueue(update: ProgressUpdate) {
    // Check rate limit before enqueuing
    if (!this.checkRateLimit(update.userId)) {
      return; // Silently drop the update if rate limit exceeded
    }

    this.progressSubject.next(update);
  }

  public async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Force process any remaining updates by triggering the subject
        // This will cause the buffered updates to be processed immediately
        this.progressSubject.next({
          userId: '',
          courseId: 0,
          chapterId: 0,
          progress: 0,
          timestamp: Date.now(),
          type: 'video'
        });

        // Give a short delay for processing to complete
        setTimeout(() => {
          resolve();
        }, 100);
      } catch (error) {
        console.error('Error during progress queue flush:', error);
        reject(error);
      }
    });
  }
}

export const progressQueue = ProgressQueue.getInstance();
