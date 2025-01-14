'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface ProgressTrackerProps {
  chapterId: number;
  videoId: string;
  courseId: number;
  currentTime: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  chapterId,
  videoId,
  courseId,
  currentTime,
}) => {
  const lastUpdateTimeRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = useCallback(async () => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 5000) {
      return; // Don't update if less than 5 seconds have passed
    }

    try {
      await axios.post('/api/progress', {
        chapterId,
        videoId,
        courseId,
        progress: Math.floor(currentTime),
      });
      lastUpdateTimeRef.current = now;
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }, [chapterId, videoId, courseId, currentTime]);

  useEffect(() => {
    updateIntervalRef.current = setInterval(updateProgress, 10000); // Update every 10 seconds

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateProgress]);

  useEffect(() => {
    // Update progress when component unmounts
    return () => {
      updateProgress();
    };
  }, [updateProgress]);

  return null; // This component doesn't render anything
};

export default ProgressTracker;

