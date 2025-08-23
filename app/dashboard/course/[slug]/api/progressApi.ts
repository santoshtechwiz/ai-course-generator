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

  private queue: ProgressUpdate[] = [];
  private isProcessing = false;
  private readonly QUEUE_KEY = 'progress-updates-queue';
  private readonly OFFLINE_FLAG = 'progress-offline-updates';
  private lastUpdatedTimestamps: Record<string, number> = {}; // Track timestamps for rate limiting
  private readonly MIN_UPDATE_INTERVAL = 120000; // 2 minutes in milliseconds

  // Store completed chapters in memory
  public completedChapters: number[] = [];

  /**
   * Load completed chapters from localStorage into memory
   */
  loadCompletedChapters(userId?: string): void {
    if (typeof window !== 'undefined' && userId) {
      try {
        const key = `completed-chapters-${userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          this.completedChapters = JSON.parse(stored);
        }
      } catch (err) {
        console.error('Failed to load completed chapters from localStorage:', err);
      }
    }
  }

  /**
   * Save completed chapters to localStorage
   */
  saveCompletedChapters(userId?: string): void {
    if (typeof window !== 'undefined' && userId) {
      try {
        const key = `completed-chapters-${userId}`;
        localStorage.setItem(key, JSON.stringify(this.completedChapters));
      } catch (err) {
        console.error('Failed to save completed chapters to localStorage:', err);
      }
    }
  }
  
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
    // Validate required fields before queuing
    if (!update.chapterId || !update.courseId || !update.videoId || !update.userId) {
      console.warn('Progress update skipped: missing required fields', update);
      return;
    }
    // Additional validation for courseId
    if (typeof update.courseId === 'undefined' || update.courseId === null || update.courseId === '' || isNaN(Number(update.courseId))) {
      console.error('Progress update skipped: invalid courseId', update.courseId, update);
      return;
    }

    // Check if we should rate limit this update
    const key = `${update.courseId}-${update.chapterId}-${update.videoId}`;
    const now = Date.now();
    const lastUpdate = this.lastUpdatedTimestamps[key] || 0;
    
    // Only queue update if it's been at least MIN_UPDATE_INTERVAL since last update
    // Exception: always queue updates for completed videos
    if (update.completed || now - lastUpdate >= this.MIN_UPDATE_INTERVAL) {
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
        console.debug(`[ProgressAPI] Queued update for ${update.videoId}, queue length: ${this.queue.length}`);
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
      // Ensure courseId is valid
      if (typeof update.courseId === 'undefined' || update.courseId === null || update.courseId === '' || isNaN(Number(update.courseId))) {
        console.error('Progress update skipped: invalid courseId in sendProgressUpdate', update.courseId, update);
        return;
      }
      
      // Ensure chapterId is a valid number
      const currentChapterId = Number(update.chapterId);
      if (isNaN(currentChapterId) || currentChapterId <= 0) {
        console.warn('Progress update skipped: invalid chapterId', update.chapterId);
        return;
      }

      // Prepare the request body with comprehensive data
      const requestBody = {
        currentChapterId: currentChapterId,
        chapterId: currentChapterId, // Support both for backward compatibility
        videoId: update.videoId,
        progress: Math.max(0, Math.min(100, update.progress || 0)),
        playedSeconds: Math.max(0, update.playedSeconds || 0),
        duration: Math.max(0, update.duration || 0),
        completedChapters: update.completed ? [currentChapterId] : [],
        isCompleted: update.completed || false
      };

      console.log(`[ProgressAPI] Sending update:`, {
        courseId: update.courseId,
        ...requestBody
      });

      // Format the API endpoint correctly
      const response = await fetch(`/api/progress/${update.courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Progress update failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Progress update failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[ProgressAPI] Update successful:`, result);
      
      // Success! Update timestamp for rate limiting
      const key = `${update.courseId}-${update.chapterId}-${update.videoId}`;
      this.lastUpdatedTimestamps[key] = Date.now();
      
      return result;
    } catch (err) {
      console.error(`Failed to update progress for course ${update.courseId}, video ${update.videoId}:`, err);
      throw err;
    }
  }
}

// Export a singleton instance
export const progressApi = new ProgressApiClient();
