"use client";

interface ProgressUpdate {
  courseId: string | number;
  chapterId: string | number;
  videoId: string;
  progress: number;
  playedSeconds: number;
  duration: number;
  completed: boolean;
  userId: string | undefined;
}

/**
 * Helper service for managing video progress API calls
 * with offline support and queuing
 */
class ProgressApiClient {
  /**
   * Validate progress update parameters
   */
  private validateProgressUpdate(update: ProgressUpdate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required fields
    if (!update.chapterId) errors.push('chapterId is required');
    if (!update.courseId) errors.push('courseId is required');
    if (!update.videoId) errors.push('videoId is required');
    if (!update.userId) errors.push('userId is required');
    
    // Check field types and values
    if (update.chapterId && typeof update.chapterId !== 'number' && typeof update.chapterId !== 'string') {
      errors.push('chapterId must be a number or string');
    }
    
    if (update.courseId && typeof update.courseId !== 'number' && typeof update.courseId !== 'string') {
      errors.push('courseId must be a number or string');
    }
    
    if (update.videoId && (typeof update.videoId !== 'string' || update.videoId.trim() === '')) {
      errors.push('videoId must be a non-empty string');
    }
    
    if (update.userId && (typeof update.userId !== 'string' || update.userId.trim() === '')) {
      errors.push('userId must be a non-empty string');
    }
    
    // Check numeric values
    if (update.chapterId) {
      const chapterIdNum = Number(update.chapterId);
      if (isNaN(chapterIdNum) || chapterIdNum <= 0) {
        errors.push('chapterId must be a positive number');
      }
    }
    
    if (update.courseId) {
      const courseIdNum = Number(update.courseId);
      if (isNaN(courseIdNum) || courseIdNum <= 0) {
        errors.push('courseId must be a positive number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  private queue: ProgressUpdate[] = [];
  private isProcessing = false;
  private readonly QUEUE_KEY = 'progress-updates-queue';
  private readonly OFFLINE_FLAG = 'progress-offline-updates';
  private lastUpdatedTimestamps: Record<string, number> = {}; // Track timestamps for rate limiting
  private readonly MIN_UPDATE_INTERVAL = 30000; // 30 seconds in milliseconds - reduced for better responsiveness
  private apiCallCount: number = 0; // Track total API calls for debugging
  
  constructor() {
    // Load any queued updates from localStorage on init
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
      
      // Set up event listeners for online/offline status
      window.addEventListener('online', this.processQueue.bind(this));
      window.addEventListener('offline', () => {
        localStorage.setItem(this.OFFLINE_FLAG, 'true');
      });
    }
  }
  
  /**
   * Queue a progress update to be sent when online
   */
  queueUpdate(update: ProgressUpdate): void {
    // Validate all parameters using the validation function
    const validation = this.validateProgressUpdate(update);
    if (!validation.isValid) {
      console.warn('Progress update skipped: validation failed', {
        errors: validation.errors,
        update: {
          chapterId: update.chapterId,
          courseId: update.courseId,
          videoId: update.videoId,
          userId: update.userId
        }
      });
      return;
    }

    // Check if we should rate limit this update
    const key = `${update.courseId}-${update.chapterId}-${update.videoId}`;
    const now = Date.now();
    const lastUpdate = this.lastUpdatedTimestamps[key] || 0;
    
    // Only queue update if it's been at least MIN_UPDATE_INTERVAL since last update
    // Exception: always queue updates for completed videos or significant progress (>10%)
    if (update.completed || update.progress > 0.1 || now - lastUpdate >= this.MIN_UPDATE_INTERVAL) {
      // Update timestamp tracker to prevent too frequent updates
      this.lastUpdatedTimestamps[key] = now;
      
      // Check if there's already a similar update in the queue
      const existingIndex = this.queue.findIndex(item => 
        item.courseId === update.courseId && 
        item.chapterId === update.chapterId &&
        item.videoId === update.videoId
      );
      
      // Replace existing update or add new one
      if (existingIndex >= 0) {
        this.queue[existingIndex] = update;
      } else {
        this.queue.push(update);
      }
      
      this.saveToLocalStorage();
      
      // Log queue length in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[ProgressAPI] Queued update for ${update.videoId}, progress: ${(update.progress * 100).toFixed(1)}%, queue length: ${this.queue.length}`);
      }
      
      // Try to process immediately if we're online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        this.processQueue();
      }
    }
  }
  
  /**
   * Process the queued updates
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    // Check if we're online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    
    try {
      this.isProcessing = true;
      
      // Process each update in the queue
      const processPromises = this.queue.map(update => this.sendProgressUpdate(update));
      await Promise.all(processPromises);
      
      // Clear the queue after successful processing
      this.queue = [];
      this.saveToLocalStorage();
      
      // Clear the offline flag
      localStorage.removeItem(this.OFFLINE_FLAG);
    } catch (err) {
      console.error('Failed to process progress updates:', err);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Save the current queue to localStorage
   */
  saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
      } catch (err) {
        console.error('Failed to save progress queue to localStorage:', err);
      }
    }
  }
  
  /**
   * Load any queued updates from localStorage
   */
  loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedQueue = localStorage.getItem(this.QUEUE_KEY);
        if (savedQueue) {
          this.queue = JSON.parse(savedQueue);
        }
      } catch (err) {
        console.error('Failed to load progress queue from localStorage:', err);
      }
    }
  }
  
  /**
   * Send a progress update to the API
   */
  private async sendProgressUpdate(update: ProgressUpdate): Promise<void> {
    try {
      // Ensure chapterId is a valid number
      const currentChapterId = Number(update.chapterId);
      if (isNaN(currentChapterId) || currentChapterId <= 0) {
        console.warn('Progress update skipped: invalid chapterId', update.chapterId);
        return;
      }

      // Ensure courseId is a valid number
      const courseId = Number(update.courseId);
      if (isNaN(courseId) || courseId <= 0) {
        console.warn('Progress update skipped: invalid courseId', update.courseId);
        return;
      }

      // Validate videoId is not empty
      if (!update.videoId || update.videoId.trim() === '') {
        console.warn('Progress update skipped: empty videoId', update.videoId);
        return;
      }

      // Format the API endpoint correctly
      const response = await fetch(`/api/progress/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChapterId: currentChapterId, // Use the validated number
          videoId: update.videoId.trim(), // Ensure clean videoId
          courseId: courseId, // Include courseId in body for additional validation
          progress: update.progress,
          playedSeconds: update.playedSeconds,
          duration: update.duration,
          completedChapters: update.completed ? [currentChapterId] : [],
          isCompleted: update.completed
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Progress update failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Progress update failed: ${response.status} ${response.statusText}`);
      }
      
      // Success! Update timestamp for rate limiting
      const key = `${update.courseId}-${update.chapterId}-${update.videoId}`;
      this.lastUpdatedTimestamps[key] = Date.now();
      this.apiCallCount++;
      
      // Log successful API call in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[ProgressAPI] Successfully updated progress for ${update.videoId}, total calls: ${this.apiCallCount}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Failed to update progress for course ${update.courseId}, video ${update.videoId}:`, err);
      throw err;
    }
  }
}

// Export a singleton instance
export const progressApi = new ProgressApiClient();
