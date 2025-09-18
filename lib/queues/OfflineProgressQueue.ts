import { storageManager } from '@/lib/storage';

interface QueuedUpdate {
  id: string;
  update: ProgressUpdate;
  attempts: number;
  lastAttempt: number;
  status: 'pending' | 'processing' | 'retrying' | 'failed';
}

interface OfflineQueue {
  queue: QueuedUpdate[];
  lastSync: number;
  version: number;
}

const OFFLINE_QUEUE_VERSION = 1;
const MAX_QUEUE_SIZE = 1000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

export class OfflineProgressQueue {
  private static instance: OfflineProgressQueue;
  private queue: QueuedUpdate[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private lastSync: number = 0;

  private constructor() {
    this.loadQueueFromStorage();
    this.setupOnlineListener();
    this.startPeriodicSync();
  }

  public static getInstance(): OfflineProgressQueue {
    if (!OfflineProgressQueue.instance) {
      OfflineProgressQueue.instance = new OfflineProgressQueue();
    }
    return OfflineProgressQueue.instance;
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.isOnline = navigator.onLine;
    }
  }

  private startPeriodicSync() {
    // Attempt to sync every minute if there are pending items
    this.syncInterval = setInterval(() => {
      if (this.queue.length > 0 && this.isOnline && !this.isSyncing) {
        this.processQueue();
      }
    }, 60000);
  }

  private handleOnline() {
    console.log('Network connection restored. Processing offline queue...');
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline() {
    console.log('Network connection lost. Updates will be queued.');
    this.isOnline = false;
  }

  private async loadQueueFromStorage() {
    try {
      const stored = await storageManager.getItem<OfflineQueue>('offline-progress-queue');
      if (stored && stored.version === OFFLINE_QUEUE_VERSION) {
        this.queue = stored.queue;
        this.lastSync = stored.lastSync;
        console.log(`Loaded ${this.queue.length} items from offline queue`);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private async saveQueueToStorage() {
    try {
      await storageManager.setItem('offline-progress-queue', {
        queue: this.queue,
        lastSync: this.lastSync,
        version: OFFLINE_QUEUE_VERSION
      });
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  public enqueue(update: ProgressUpdate) {
    const queuedUpdate: QueuedUpdate = {
      id: crypto.randomUUID(),
      update,
      attempts: 0,
      lastAttempt: 0,
      status: 'pending'
    };

    // Add to queue, maintaining max size
    this.queue.push(queuedUpdate);
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue.shift(); // Remove oldest item if queue is full
    }

    this.saveQueueToStorage();

    // Try to process immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    console.log(`Processing offline queue (${this.queue.length} items)...`);

    try {
      // Group updates by type and proximity
      const batches = this.createBatches();
      
      for (const batch of batches) {
        try {
          await this.processBatch(batch);
        } catch (error) {
          console.error('Error processing batch:', error);
          // Mark batch items for retry
          batch.forEach(item => {
            item.attempts++;
            item.lastAttempt = Date.now();
            item.status = item.attempts >= MAX_RETRY_ATTEMPTS ? 'failed' : 'retrying';
          });
        }
      }

      // Remove successfully processed items and save
      this.queue = this.queue.filter(item => item.status !== 'processing');
      this.lastSync = Date.now();
      await this.saveQueueToStorage();

    } finally {
      this.isSyncing = false;
    }
  }

  private createBatches(): QueuedUpdate[][] {
    const batches: QueuedUpdate[][] = [];
    let currentBatch: QueuedUpdate[] = [];
    const now = Date.now();

    // Sort by attempts (fewer first) and timestamp
    const sortedQueue = [...this.queue]
      .filter(item => item.status !== 'failed')
      .sort((a, b) => {
        if (a.attempts !== b.attempts) {
          return a.attempts - b.attempts;
        }
        return a.update.timestamp - b.update.timestamp;
      });

    for (const item of sortedQueue) {
      // Start new batch if current is full or item needs retry delay
      if (currentBatch.length >= 10 || 
          (item.lastAttempt > 0 && now - item.lastAttempt < RETRY_DELAY_MS)) {
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
          currentBatch = [];
        }
        if (item.lastAttempt > 0 && now - item.lastAttempt < RETRY_DELAY_MS) {
          continue; // Skip items still in retry delay
        }
      }
      currentBatch.push(item);
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private async processBatch(batch: QueuedUpdate[]) {
    // Mark batch items as processing
    batch.forEach(item => {
      item.status = 'processing';
    });

    const updates = batch.map(item => item.update);

    const response = await fetch('/api/progress/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to process batch: ${response.status}`);
    }

    return response.json();
  }

  public getQueueStatus() {
    const total = this.queue.length;
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const processing = this.queue.filter(i => i.status === 'processing').length;
    const retrying = this.queue.filter(i => i.status === 'retrying').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;

    return {
      total,
      pending,
      processing,
      retrying,
      failed,
      lastSync: this.lastSync,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }

  public async retryFailedUpdates() {
    // Reset failed items to pending
    this.queue
      .filter(item => item.status === 'failed')
      .forEach(item => {
        item.status = 'pending';
        item.attempts = 0;
      });

    await this.saveQueueToStorage();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  public clearFailedUpdates() {
    this.queue = this.queue.filter(item => item.status !== 'failed');
    this.saveQueueToStorage();
  }
}