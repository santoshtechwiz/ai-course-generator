import { useEffect } from 'react';
import { progressQueue, ProgressUpdate } from '@/lib/queues/ProgressQueue';

interface UseProgressTrackerOptions {
  userId: string;
  courseId: number;
  chapterId: number;
  onError?: (error: Error) => void;
  batchInterval?: number;
}

export default function useProgressTracker({
  userId,
  courseId,
  chapterId,
  onError,
}: UseProgressTrackerOptions) {
  useEffect(() => {
    return () => {
      // Flush any pending updates when component unmounts
      progressQueue.flush().catch(error => {
        onError?.(error as Error);
      });
    };
  }, [onError]);

  const updateProgress = (
    progress: number,
    type: 'video' | 'quiz' | 'chapter',
    metadata?: Record<string, any>
  ) => {
    const update: ProgressUpdate = {
      userId,
      courseId,
      chapterId,
      progress,
      type,
      timestamp: Date.now(),
      metadata,
    };

    progressQueue.enqueue(update);
  };

  return {
    updateProgress,
  };
}
