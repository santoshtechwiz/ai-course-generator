"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProgress } from "@/store/slices/courseSlice";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface UseProgressProps {
  courseId: number;
  initialProgress?: any;
  currentChapterId?: string;
  useSSE?: boolean;
}

const useProgress = ({
  courseId,
  initialProgress,
  currentChapterId,
  useSSE = true,
}: UseProgressProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const reduxProgress = useAppSelector((state) => state.course.courseProgress[courseId]);
  const errorRef = useRef<Error | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the event source URL to prevent unnecessary reconnections
  const eventSourceUrl = useMemo(() => {
    return `/api/sse?courseId=${courseId}${currentChapterId ? `&chapterId=${currentChapterId}` : ""}`;
  }, [courseId, currentChapterId]);

  // Fetch progress from API and update Redux
  const fetchProgress = useCallback(async () => {
    try {
      const response = await axios.get(`/api/progress/${courseId}`);
      if (response.data) {
        dispatch(
          updateProgress({
            courseId,
            progress: response.data.progress || 0,
            completedChapters: Array.isArray(response.data.completedChapters)
              ? response.data.completedChapters
              : (typeof response.data.completedChapters === "string"
                ? JSON.parse(response.data.completedChapters)
                : []),
            currentChapterId: response.data.currentChapterId,
            isCompleted: response.data.isCompleted || false,
            lastPlayedAt: response.data.lastAccessedAt,
            resumePoint: response.data.resumePoint,
          })
        );
      }
    } catch (err) {
      errorRef.current = err as Error;
    }
  }, [courseId, dispatch]);

  // Unified progress sync: SSE primary, polling fallback
  useEffect(() => {
    let fallbackTimeout: NodeJS.Timeout | null = null;

    if (useSSE) {
      const eventSource = new EventSource(eventSourceUrl);
      sseRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.progress) {
            dispatch(
              updateProgress({
                courseId,
                progress: data.progress.progress || 0,
                completedChapters: Array.isArray(data.progress.completedChapters)
                  ? data.progress.completedChapters
                  : (typeof data.progress.completedChapters === "string"
                    ? JSON.parse(data.progress.completedChapters)
                    : []),
                currentChapterId: data.progress.currentChapterId,
                isCompleted: data.progress.isCompleted || false,
                lastPlayedAt: data.progress.lastAccessedAt,
                resumePoint: data.progress.resumePoint,
              })
            );
          }
        } catch (err) {
          // fallback to polling if SSE fails
          if (!pollingRef.current) {
            pollingRef.current = setInterval(fetchProgress, 10000);
          }
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchProgress, 10000);
        }
      };

      // Initial fetch in case SSE is slow to connect
      fetchProgress();

      return () => {
        eventSource.close();
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    } else {
      // Polling fallback
      fetchProgress();
      pollingRef.current = setInterval(fetchProgress, 10000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [courseId, eventSourceUrl, dispatch, useSSE, fetchProgress]);

  // Update progress function that updates both API and Redux
  const updateProgressData = useCallback(
    async (data: any) => {
      try {
        let completeChapters: number[] = [];

        if (data.completedChapters) {
          // Always clone to avoid mutating frozen arrays
          completeChapters = Array.isArray(data.completedChapters)
            ? [...data.completedChapters]
            : [];
        } else if (reduxProgress?.completedChapters) {
          completeChapters = Array.isArray(reduxProgress.completedChapters)
            ? [...reduxProgress.completedChapters]
            : (typeof reduxProgress.completedChapters === "string"
              ? [...JSON.parse(reduxProgress.completedChapters)]
              : []);
        }

        // If a chapter was completed and it's not in the array, add it
        if (data.currentChapterId && !completeChapters.includes(data.currentChapterId)) {
          completeChapters = [...completeChapters, data.currentChapterId];
        }

        dispatch(
          updateProgress({
            courseId,
            progress: data.progress ?? reduxProgress?.progress ?? 0,
            completedChapters: completeChapters,
            currentChapterId: data.currentChapterId ?? reduxProgress?.currentChapterId,
            isCompleted: data.isCompleted ?? reduxProgress?.isCompleted ?? false,
            lastPlayedAt: new Date().toISOString(),
            resumePoint: data.resumePoint ?? reduxProgress?.resumePoint,
          })
        );

        const response = await axios.post(`/api/progress/${courseId}`, {
          ...data,
          completedChapters: completeChapters,
        });

        if (response.data) {
          dispatch(
            updateProgress({
              courseId,
              progress: response.data.progress || 0,
              completedChapters: Array.isArray(response.data.completedChapters)
                ? [...response.data.completedChapters]
                : (typeof response.data.completedChapters === "string"
                  ? [...JSON.parse(response.data.completedChapters)]
                  : []),
              currentChapterId: response.data.currentChapterId,
              isCompleted: response.data.isCompleted || false,
              lastPlayedAt: response.data.lastAccessedAt,
              resumePoint: response.data.resumePoint,
            })
          );
        }

        return response.data;
      } catch (err) {
        toast({
          title: "Failed to save progress",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
        errorRef.current = err as Error;
        throw err;
      }
    },
    [courseId, reduxProgress, dispatch, toast]
  );

  return {
    progress: reduxProgress,
    isLoading: !reduxProgress,
    error: errorRef.current,
    updateProgress: updateProgressData,
  };
};

export default useProgress;
