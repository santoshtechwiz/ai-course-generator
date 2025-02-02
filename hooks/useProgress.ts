import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CourseProgress } from '@/app/types/types';

export interface UseProgressProps {
  courseId: number;
  initialProgress?: CourseProgress;
  currentChapterId?: string;
}

const useProgress = ({ courseId, initialProgress, currentChapterId }: UseProgressProps) => {
  const [progress, setProgress] = useState<CourseProgress | null>(initialProgress || null);
  const [isLoading, setIsLoading] = useState(!initialProgress);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await axios.get(`/api/progress/${courseId}`);
      setProgress(response.data.progress);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setIsLoading(false);
    }
  }, [courseId]);

  const updateProgress = useCallback(async (update: Partial<CourseProgress>) => {
    try {
      const newData = {
        ...update,
        completedChapters: [
          ...new Set([...(progress?.completedChapters || []), ...(update.completedChapters || [])])
        ]
      };
      const response = await axios.post(`/api/progress/${courseId}`, newData);
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [courseId, progress]);

  useEffect(() => {
    if (!initialProgress) {
      fetchProgress();
    }
  }, [fetchProgress, initialProgress]);

  return { progress, isLoading, updateProgress };
};

export default useProgress;

