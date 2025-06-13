import { throttle } from "../components/video/hooks/progressUtils";

interface ProgressData {
  courseId: string | number;
  chapterId: string | number;
  videoId: string;
  progress: number;
  playedSeconds: number;
  duration: number;
  completed?: boolean;
  userId?: string;
}

class ProgressAPI {
  private static instance: ProgressAPI;
  private pendingUpdates: Record<string, ProgressData> = {};
  private syncInProgress = false;
  private offlineMode = false;
  
  private constructor() {
    this.setupNetworkListeners();
    this.throttledSync = throttle(this.syncPendingUpdates.bind(this), 10000);
  }
  
  public static getInstance(): ProgressAPI {
    if (!ProgressAPI.instance) {
      ProgressAPI.instance = new ProgressAPI();
    }
    return ProgressAPI.instance;
  }
  
  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.offlineMode = false;
        this.syncPendingUpdates();
      });
      
      window.addEventListener('offline', () => {
        this.offlineMode = true;
      });
      
      // Initial state
      this.offlineMode = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    }
  }
  
  // Queue an update to be sent to the server
  public queueUpdate(data: ProgressData): void {
    const key = `${data.courseId}-${data.chapterId}-${data.videoId}`;
    this.pendingUpdates[key] = {
      ...this.pendingUpdates[key],
      ...data,
      timestamp: Date.now(),
    };
    
    // Save to local storage as backup
    this.saveToLocalStorage();
    
    // Try to sync if online
    if (!this.offlineMode) {
      this.throttledSync();
    }
  }
  
  // Throttled sync to avoid too many API calls
  private throttledSync: () => void;
  
  // Sync all pending updates to the server
  private async syncPendingUpdates(): Promise<void> {
    if (this.syncInProgress || this.offlineMode || Object.keys(this.pendingUpdates).length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      const updatesToSync = { ...this.pendingUpdates };
      const updatePromises = Object.values(updatesToSync).map(async (data) => {
        try {
          await fetch('/api/progress/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          // Delete from pending updates on success
          const key = `${data.courseId}-${data.chapterId}-${data.videoId}`;
          delete this.pendingUpdates[key];
        } catch (error) {
          console.error('Failed to sync progress:', error);
          // Keep in pending updates to try again later
        }
      });
      
      await Promise.all(updatePromises);
      this.saveToLocalStorage();
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Save pending updates to localStorage
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('pendingProgressUpdates', JSON.stringify(this.pendingUpdates));
    } catch (error) {
      console.error('Failed to save pending updates to localStorage:', error);
    }
  }
  
  // Load pending updates from localStorage
  public loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('pendingProgressUpdates');
      if (saved) {
        this.pendingUpdates = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load pending updates from localStorage:', error);
    }
  }
  
  // Force a sync (can be called when user manually triggers a sync)
  public async forceSyncNow(): Promise<void> {
    await this.syncPendingUpdates();
  }
}

// Export singleton instance
export const progressApi = ProgressAPI.getInstance();
