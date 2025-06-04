import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Define the state interface
interface VideoProgress {
  time: number
  playedSeconds: number
  duration: number
}

interface CourseProgress {
  courseId: number
  progress: number
  completedChapters: number[]
  currentChapterId?: number
  isCompleted: boolean
  lastPlayedAt?: string
  resumePoint?: number
  isAvailableOffline?: boolean // New field for offline availability
}

interface BookmarkData {
  videoId: string
  time: number
}

interface PlaybackSettings {
  volume: number
  muted: boolean
  playbackSpeed: number
  autoQuality?: boolean // New field for auto quality adjustment
  preload?: string // New field for preload setting
}

interface CourseState {
  currentVideoId: string | null
  videoProgress: Record<string, VideoProgress>
  autoplayEnabled: boolean
  bookmarks: Record<string, number[]>
  courseProgress: Record<number, CourseProgress>
  currentCourseId: number | null
  currentCourseSlug: string | null
  courseCompletionStatus: boolean
  playbackSettings: PlaybackSettings
}

// Initial state
const initialState: CourseState = {
  currentVideoId: null,
  videoProgress: {},
  autoplayEnabled: true,
  bookmarks: {},
  courseProgress: {},
  currentCourseId: null,
  currentCourseSlug: null,
  courseCompletionStatus: false,
  playbackSettings: {
    volume: 0.8,
    muted: false,
    playbackSpeed: 1.0,
  },
}

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCurrentVideo(state, action: PayloadAction<string>) {
      state.currentVideoId = action.payload
    },
    setVideoProgress(
      state,
      action: PayloadAction<{
        videoId: string
        time: number
        playedSeconds?: number
        duration?: number
      }>,
    ) {
      const { videoId, time, playedSeconds, duration } = action.payload
      state.videoProgress[videoId] = {
        time,
        playedSeconds: playedSeconds || state.videoProgress[videoId]?.playedSeconds || 0,
        duration: duration || state.videoProgress[videoId]?.duration || 0,
      }
    },
    setAutoplayEnabled(state, action: PayloadAction<boolean>) {
      state.autoplayEnabled = action.payload
    },
    addBookmark(state, action: PayloadAction<BookmarkData>) {
      const { videoId, time } = action.payload
      if (!state.bookmarks[videoId]) {
        state.bookmarks[videoId] = []
      }
      // Prevent duplicate bookmarks
      if (!state.bookmarks[videoId].includes(time)) {
        state.bookmarks[videoId].push(time)
        // Sort bookmarks by time
        state.bookmarks[videoId].sort((a, b) => a - b)
      }
    },
    removeBookmark(state, action: PayloadAction<BookmarkData>) {
      const { videoId, time } = action.payload
      if (state.bookmarks[videoId]) {
        state.bookmarks[videoId] = state.bookmarks[videoId].filter(
          (bookmark) => Math.abs(bookmark - time) > 1, // Add a small tolerance
        )
      }
    },
    updateProgress(state, action: PayloadAction<CourseProgress>) {
      const {
        courseId,
        progress,
        completedChapters,
        currentChapterId,
        isCompleted,
        lastPlayedAt,
        resumePoint,
        isAvailableOffline,
      } = action.payload
      state.courseProgress[courseId] = {
        courseId,
        progress,
        completedChapters,
        currentChapterId,
        isCompleted,
        lastPlayedAt,
        resumePoint,
        isAvailableOffline,
      }
    },
    setResumePoint(state, action: PayloadAction<{ courseId: number; resumePoint: number }>) {
      const { courseId, resumePoint } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].resumePoint = resumePoint
      }
    },
    setLastPlayedAt(state, action: PayloadAction<{ courseId: number; lastPlayedAt: string }>) {
      const { courseId, lastPlayedAt } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].lastPlayedAt = lastPlayedAt
      }
    },
    markChapterAsStarted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].currentChapterId = chapterId
      }
    },
    markChapterAsCompleted(state, action: PayloadAction<{ courseId: number; chapterId: number }>) {
      const { courseId, chapterId } = action.payload
      if (state.courseProgress[courseId]) {
        const completedChapters = [...state.courseProgress[courseId].completedChapters]
        if (!completedChapters.includes(chapterId)) {
          completedChapters.push(chapterId)
          state.courseProgress[courseId].completedChapters = completedChapters

          // Recalculate progress (would need total chapter count for accuracy)
          // This is simplified - actual calculation would need total chapter count
          // state.courseProgress[courseId].progress = (completedChapters.length / totalChapters) * 100;
        }
      }
    },
    initializeCourseState(
      state,
      action: PayloadAction<{
        courseId: number
        courseSlug: string
        initialVideoId?: string
      }>,
    ) {
      const { courseId, courseSlug, initialVideoId } = action.payload
      state.currentCourseId = courseId
      state.currentCourseSlug = courseSlug

      if (initialVideoId) {
        state.currentVideoId = initialVideoId
      }

      // Initialize course progress if not exists
      if (!state.courseProgress[courseId]) {
        state.courseProgress[courseId] = {
          courseId,
          progress: 0,
          completedChapters: [],
          isCompleted: false,
        }
      }
    },
    setCourseCompletionStatus(state, action: PayloadAction<boolean>) {
      state.courseCompletionStatus = action.payload
    },
    setPlaybackSettings(state, action: PayloadAction<PlaybackSettings>) {
      state.playbackSettings = action.payload
    },
    resetCourseState(state) {
      state.currentVideoId = null
      state.currentCourseId = null
      state.currentCourseSlug = null
      state.courseCompletionStatus = false
    },
    setOfflineAvailability(
      state,
      action: PayloadAction<{ courseId: number; videoId: string; isAvailableOffline: boolean }>,
    ) {
      const { courseId, videoId, isAvailableOffline } = action.payload
      if (state.courseProgress[courseId]) {
        state.courseProgress[courseId].isAvailableOffline = isAvailableOffline
      }
    },
  },
})

// Fix the setCurrentVideoApi function to properly handle errors and improve performance
export const setCurrentVideoApi = (videoId: string) => (dispatch, getState) => {
  try {
    // Check if we're already on this video to prevent unnecessary updates
    const currentState = getState()
    if (currentState.course.currentVideoId === videoId) {
      return // No need to update if it's the same video
    }

    console.debug("[courseSlice] Setting current video:", videoId)
    dispatch(courseSlice.actions.setCurrentVideo(videoId))

    // Persist to local storage for better recovery
    try {
      localStorage.setItem("currentVideoId", videoId)
    } catch (storageError) {
      console.warn("[courseSlice] Error saving to local storage:", storageError)
    }

    // Track video change for analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "video_change", {
        video_id: videoId,
        course_id: currentState.course.currentCourseId,
      })
    }
  } catch (error) {
    console.error("[courseSlice] Error setting current video:", error)
    // Dispatch error action if needed
  }
}

// Add a new action to optimize video playback
export const optimizeVideoPlayback = () => (dispatch, getState) => {
  const state = getState()
  const { playbackSettings } = state.course

  // Detect network conditions
  if (navigator.connection) {
    const connection = navigator.connection

    // Automatically adjust quality based on network
    if (connection.effectiveType === "2g" || connection.effectiveType === "slow-2g") {
      // On slow connections, reduce quality and preload
      dispatch(
        courseSlice.actions.setPlaybackSettings({
          ...playbackSettings,
          autoQuality: true,
          preload: "metadata",
        }),
      )
    } else if (connection.saveData) {
      // If data saver is enabled
      dispatch(
        courseSlice.actions.setPlaybackSettings({
          ...playbackSettings,
          autoQuality: true,
          preload: "metadata",
        }),
      )
    }
  }
}

// Add a new action to batch update progress for better performance
export const batchUpdateProgress = (progressData) => (dispatch, getState) => {
  // Debounce progress updates to reduce state changes
  if (!window._progressUpdateTimeout) {
    window._progressUpdateTimeout = setTimeout(() => {
      dispatch(courseSlice.actions.updateProgress(progressData))
      window._progressUpdateTimeout = null
    }, 2000) // Update at most every 2 seconds
  }
}

// Add a new action to handle offline mode
export const enableOfflineMode = (courseId, videoId) => async (dispatch) => {
  try {
    // Check if the browser supports service workers
    if ("serviceWorker" in navigator && "caches" in window) {
      // Cache the current video for offline viewing
      const cache = await caches.open("video-cache")
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      await cache.add(videoUrl)

      dispatch({
        type: "course/setOfflineAvailability",
        payload: {
          courseId,
          videoId,
          isAvailableOffline: true,
        },
      })

      return true
    }
    return false
  } catch (error) {
    console.error("Failed to cache video for offline use:", error)
    return false
  }
}

export const {
  setCurrentVideo,
  setVideoProgress,
  setAutoplayEnabled,
  addBookmark,
  removeBookmark,
  updateProgress,
  setResumePoint,
  setLastPlayedAt,
  markChapterAsStarted,
  markChapterAsCompleted,
  initializeCourseState,
  setCourseCompletionStatus,
  setPlaybackSettings,
  resetCourseState,
  setOfflineAvailability,
} = courseSlice.actions

export default courseSlice.reducer
