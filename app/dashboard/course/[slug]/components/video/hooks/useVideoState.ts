import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface VideoState {
  // Course-level state
  currentVideoId: string | null
  currentCourseId: string | null
  courseProgress: Record<string, {
    completedChapters: string[]
    isCompleted: boolean
    lastAccessedAt: string
    resumePoint: number
    lastWatchedVideoId?: string
  }>
  
  // Video-level state
  videoProgress: Record<string, {
    time: number
    duration: number
    played: number
    playedSeconds: number
    lastUpdatedAt: string
  }>
  bookmarks: Record<string, number[]>
  
  // Actions
  setCurrentVideo: (videoId: string | null, courseId?: string | number | null) => void
  updateVideoProgress: (videoId: string, played: number, playedSeconds: number, duration: number) => void
  updateProgress: (videoId: string, playedSeconds: number) => void
  markChapterCompleted: (courseId: string, chapterId: string) => void
  addBookmark: (videoId: string, time: number) => void
  removeBookmark: (videoId: string, time: number) => void
  setLastWatchedVideo: (courseId: string, videoId: string) => void
  resetState: () => void // Add a reset function
}

// Initial state to use for resets
const initialState = {
  currentVideoId: null,
  currentCourseId: null,
  courseProgress: {},
  videoProgress: {},
  bookmarks: {}
};

// Create a persisted store for video state
export const useVideoState = create<VideoState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentVideo: (videoId, courseId) => set((state) => {
        if (!videoId) return state; // Don't update if videoId is null/empty
        
        // Convert courseId to string if it exists
        const courseIdStr = courseId ? String(courseId) : state.currentCourseId;
        
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[VideoState] Setting current video:', { 
            videoId, 
            courseId: courseIdStr || 'null' 
          });
        }
        
        return {
          currentVideoId: videoId,
          currentCourseId: courseIdStr
        };
      }),
      
      updateVideoProgress: (videoId, played, playedSeconds, duration) => 
        set((state) => {
          // Apply throttling logic: only update if significant change or time passed
          const lastUpdate = state.videoProgress[videoId]?.lastUpdatedAt;
          const now = new Date().toISOString();
          const shouldUpdate = !lastUpdate || 
            (new Date(now).getTime() - new Date(lastUpdate || '').getTime() > 5000) || 
            Math.abs((state.videoProgress[videoId]?.played || 0) - played) > 0.05;
            
          if (!shouldUpdate) return state;
          
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[VideoState] Updating progress:', { 
              videoId, 
              played: Math.round(played * 100) / 100,
              playedSeconds: Math.round(playedSeconds),
              duration: Math.round(duration)
            });
          }
            
          return {
            videoProgress: {
              ...state.videoProgress,
              [videoId]: {
                time: played,
                played,
                playedSeconds,
                duration,
                lastUpdatedAt: now
              }
            }
          };
        }),
        
      updateProgress: (videoId, playedSeconds) => 
        set((state) => {
          const lastUpdate = state.videoProgress[videoId]?.lastUpdatedAt;
          const now = new Date().toISOString();
          const shouldUpdate = !lastUpdate || 
            (new Date(now).getTime() - new Date(lastUpdate || '').getTime() > 5000) || 
            Math.abs((state.videoProgress[videoId]?.playedSeconds || 0) - playedSeconds) > 0.05;
            
          if (!shouldUpdate) return state;
          
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[VideoState] Updating progress:', { 
              videoId, 
              playedSeconds: Math.round(playedSeconds)
            });
          }
            
          return {
            videoProgress: {
              ...state.videoProgress,
              [videoId]: {
                ...state.videoProgress[videoId],
                playedSeconds,
                lastUpdatedAt: now
              }
            }
          };
        }),
        
      markChapterCompleted: (courseId, chapterId) => 
        set((state) => {
          const course = state.courseProgress[courseId] || {
            completedChapters: [],
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            resumePoint: 0
          };
          
          if (course.completedChapters.includes(chapterId)) {
            return state;
          }
          
          return {
            courseProgress: {
              ...state.courseProgress,
              [courseId]: {
                ...course,
                completedChapters: [...course.completedChapters, chapterId],
                lastAccessedAt: new Date().toISOString()
              }
            }
          };
        }),
      
      addBookmark: (videoId, time) => 
        set((state) => {
          const bookmarks = state.bookmarks[videoId] || [];
          if (bookmarks.some(bookmark => Math.abs(bookmark - time) < 1)) {
            return state;
          }
          return {
            bookmarks: {
              ...state.bookmarks,
              [videoId]: [...bookmarks, time].sort((a, b) => a - b)
            }
          };
        }),
        
      removeBookmark: (videoId, time) => 
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [videoId]: (state.bookmarks[videoId] || [])
              .filter(bookmark => Math.abs(bookmark - time) >= 1)
          }
        })),

      setLastWatchedVideo: (courseId, videoId) =>
        set(state => {
          const course = state.courseProgress[courseId] || {
            completedChapters: [],
            isCompleted: false,
            lastAccessedAt: new Date().toISOString(),
            resumePoint: 0
          };
          
          return {
            courseProgress: {
              ...state.courseProgress,
              [courseId]: {
                ...course,
                lastWatchedVideoId: videoId,
                lastAccessedAt: new Date().toISOString()
              }
            }
          };
        }),

      resetState: () => set(initialState),
    }),
    {
      name: 'video-progress-state',
      partialize: (state) => ({
        // Only persist these parts of the state
        videoProgress: state.videoProgress,
        courseProgress: state.courseProgress,
        bookmarks: state.bookmarks,
        currentCourseId: state.currentCourseId,
        currentVideoId: state.currentVideoId,
      }),
    }
  )
)

// Ensure the hook returns the state object correctly
export default useVideoState;

// Add helper functions to diagnose and fix state issues
export function debugVideoState() {
  const state = useVideoState.getState();
  console.group('Video State Debug');
  console.log('Current Video ID:', state.currentVideoId);
  console.log('Current Course ID:', state.currentCourseId);
  console.log('Video Progress Keys:', Object.keys(state.videoProgress));
  console.log('Course Progress Keys:', Object.keys(state.courseProgress));
  console.log('Bookmarks Keys:', Object.keys(state.bookmarks));
  console.groupEnd();
  return state;
}

export function resetVideoState() {
  useVideoState.getState().resetState();
  console.log('Video state has been reset');
}

export function forceVideoSelection(videoId: string, courseId: string | number) {
  useVideoState.getState().setCurrentVideo(videoId, courseId);
  console.log(`Forced video selection: videoId=${videoId}, courseId=${courseId}`);
  return debugVideoState();
}

// Add a helper to safely get bookmarks for a video
export function getVideoBookmarks(videoId: string | null) {
  if (!videoId) return [];
  
  const state = useVideoState.getState();
  return state.bookmarks[videoId] || [];
}
