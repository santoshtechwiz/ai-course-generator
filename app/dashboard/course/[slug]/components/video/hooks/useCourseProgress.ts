"use client";

import { useState, useEffect, useCallback } from "react";
import { useVideoState } from "./useVideoState";
import { progressApi } from "../../../api/progressApi";

interface UseCourseProgressProps {
  courseId: string | number;
  videoId: string | null;
  chapterId?: string;
  duration?: number;
}

export function useCourseProgress({
  courseId,
  videoId,
  chapterId,
  duration = 0,
}: UseCourseProgressProps) {
  const videoStateStore = useVideoState();
  const [progress, setProgress] = useState(() => {
    const state = videoStateStore.getState();
    return state.videoProgress[videoId || ""] || {
      played: 0,
      playedSeconds: 0,
      duration,
    };
  });

  useEffect(() => {
    const unsubscribe = videoStateStore.subscribe((state) => {
      const videoProgress = state.videoProgress[videoId || ""];
      if (videoProgress) {
        setProgress(videoProgress);
      }
    });

    return () => unsubscribe();
  }, [videoId, videoStateStore]);

  const updateProgress = useCallback(
    (played: number, playedSeconds: number) => {
      videoStateStore.getState().updateVideoProgress(videoId || "", played, playedSeconds, duration);

      progressApi.queueUpdate({
        courseId,
        chapterId: chapterId || "",
        videoId: videoId || "",
        progress: played,
        playedSeconds,
        duration,
        completed: played >= 0.95,
        userId: "guest",
      });
    },
    [courseId, chapterId, videoId, duration, videoStateStore]
  );

  return {
    progress,
    updateProgress,
  };
}
