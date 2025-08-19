"use client";

import { validateVideoProgress, type VideoProgress } from "@/schema/progress-schema"

interface ProgressUpdate {
  courseId: string | number;
  chapterId: string | number;
  videoId?: string;
  progress?: number;
  playedSeconds?: number;
  duration?: number;
  completed?: boolean;
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
  private readonly MIN_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds
  
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
    try {
      // Validate the update data
      const validatedData = validateVideoProgress({
        courseId: update.courseId,
        chapterId: update.chapterId,
        videoId: update.videoId,
        progress: update.progress,
        playedSeconds: update.playedSeconds,
        duration: update.duration,
        completed: update.completed,
      });

      // Check if we should rate limit this update
      const key = `${validatedData.courseId}-${validatedData.chapterId}-${validatedData.videoId || 'no-video'}`;
      const now = Date.now();
      const lastUpdate = this.lastUpdatedTimestamps[key] || 0;
      
      // Only queue update if it's been at least MIN_UPDATE_INTERVAL since last update
      // Exception: always queue updates for completed videos
      if (validatedData.completed || now - lastUpdate >= this.MIN_UPDATE_INTERVAL) {
        // Update timestamp tracker to prevent too frequent updates
        this.lastUpdatedTimestamps[key] = now;
        
        // Check if there's already a similar update in the queue
        const existingIndex = this.queue.findIndex(item => 
          item.courseId === validatedData.courseId && 
          item.chapterId === validatedData.chapterId &&
          item.videoId === validatedData.videoId
        );
        
        // Replace existing update or add new one
        if (existingIndex >= 0) {
          this.queue[existingIndex] = {
            courseId: validatedData.courseId,
            chapterId: validatedData.chapterId,
            videoId: validatedData.videoId,
            progress: validatedData.progress,
            playedSeconds: validatedData.playedSeconds,
            duration: validatedData.duration,
            completed: validatedData.completed,
            userId: update.userId,
          };
        } else {
          this.queue.push({
            courseId: validatedData.courseId,
            chapterId: validatedData.chapterId,
            videoId: validatedData.videoId,
            progress: validatedData.progress,
            playedSeconds: validatedData.playedSeconds,
            duration: validatedData.duration,
            completed: validatedData.completed,
            userId: update.userId,
          });
        }
        
        this.saveToLocalStorage();
        
        // Log queue length in development
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[ProgressAPI] Queued update for ${validatedData.videoId || 'chapter'}, queue length: ${this.queue.length}`);
        }
        
        // Try to process immediately if we're online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.processQueue();
        }
      }
    } catch (error) {
      console.error('[ProgressAPI] Failed to queue update due to validation error:', error);
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
      // Format the API endpoint correctly
      const response = await fetch(`/api/progress/${update.courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChapterId: update.chapterId,
          videoId: update.videoId,
          progress: update.progress,
          // Include completed chapters if the video is completed
          completedChapters: update.completed ? [Number(update.chapterId)] : [],
          isCompleted: update.completed,
          // Include time tracking if available
          playedSeconds: update.playedSeconds,
          duration: update.duration,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Progress update failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      // Success! Update timestamp for rate limiting
      const key = `${update.courseId}-${update.chapterId}-${update.videoId || 'no-video'}`;
      this.lastUpdatedTimestamps[key] = Date.now();
      
      const result = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[ProgressAPI] Successfully updated progress:`, result);
      }
      
      return result;
    } catch (err) {
      console.error(`Failed to update progress for course ${update.courseId}, chapter ${update.chapterId}:`, err);
      throw err;
    }
  }
}

// Export a singleton instance
export const progressApi = new ProgressApiClient();
