import courseReducer, {
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
  cacheVideoData,
  setPerformanceSettings,
  setUserPreferences,
  trackAnalytics,
  updateUserProgress,
  setUserPlaybackSettings,
  initializeGuestProgress,
  setGuestPlaybackSettings,
  setNextVideoId,
  setPrevVideoId,
  setLoading,
} from "@/store/slices/courseSlice"
import { configureStore } from "@reduxjs/toolkit"

describe("courseSlice", () => {
  let store: any

  beforeEach(() => {
    store = configureStore({
      reducer: {
        course: courseReducer,
      },
    })
  })

  it("should handle initial state", () => {
    expect(courseReducer(undefined, { type: "" })).toEqual({
      currentVideoId: null,
      videoProgress: {},
      autoplayEnabled: true,
      bookmarks: {},
      courseProgress: {},
      userProgress: {},
      guestProgress: {},
      currentCourseId: null,
      currentCourseSlug: null,
      courseCompletionStatus: false,
      playbackSettings: {
        volume: 0.8,
        muted: false,
        playbackSpeed: 1.0,
      },
      userPlaybackSettings: {},
      guestPlaybackSettings: {
        volume: 0.8,
        muted: false,
        playbackSpeed: 1.0,
      },
      nextVideoId: null,
      prevVideoId: null,
      isLoading: true,
      videoCache: undefined,
      performanceSettings: undefined,
      userPreferences: undefined,
      analytics: undefined,
    })
  })

  it("should set current video ID", () => {
    store.dispatch(setCurrentVideo("testVideo"))
    expect(store.getState().course.currentVideoId).toEqual("testVideo")
  })

  it("should set video progress", () => {
    store.dispatch(setVideoProgress({ videoId: "testVideo", time: 0.5, playedSeconds: 30, duration: 60 }))
    expect(store.getState().course.videoProgress["testVideo"]).toEqual({
      time: 0.5,
      playedSeconds: 30,
      duration: 60,
    })
  })

  it("should toggle autoplay", () => {
    store.dispatch(setAutoplayEnabled(false))
    expect(store.getState().course.autoplayEnabled).toEqual(false)
  })

  it("should add a bookmark", () => {
    store.dispatch(addBookmark({ videoId: "testVideo", time: 10 }))
    expect(store.getState().course.bookmarks["testVideo"]).toEqual([10])
  })

  it("should remove a bookmark", () => {
    store.dispatch(addBookmark({ videoId: "testVideo", time: 10 }))
    store.dispatch(removeBookmark({ videoId: "testVideo", time: 10 }))
    expect(store.getState().course.bookmarks["testVideo"]).toEqual([])
  })

  it("should update course progress", () => {
    const progressData = {
      courseId: 1,
      progress: 0.75,
      completedChapters: [1, 2],
      currentChapterId: 3,
      isCompleted: false,
      lastPlayedAt: "2023-01-01T00:00:00.000Z",
      resumePoint: 45,
    }
    store.dispatch(updateProgress(progressData))
    expect(store.getState().course.courseProgress[1]).toEqual(progressData)
  })

  it("should set resume point", () => {
    store.dispatch(setResumePoint({ courseId: 1, resumePoint: 60 }))
    expect(store.getState().course.courseProgress[1].resumePoint).toEqual(60)
  })

  it("should set last played at", () => {
    store.dispatch(setLastPlayedAt({ courseId: 1, lastPlayedAt: "2023-01-02T00:00:00.000Z" }))
    expect(store.getState().course.courseProgress[1].lastPlayedAt).toEqual("2023-01-02T00:00:00.000Z")
  })

  it("should mark chapter as started", () => {
    store.dispatch(markChapterAsStarted({ courseId: 1, chapterId: 3 }))
    expect(store.getState().course.courseProgress[1].currentChapterId).toEqual(3)
  })

  it("should mark chapter as completed", () => {
    store.dispatch(markChapterAsCompleted({ courseId: 1, chapterId: 3 }))
    expect(store.getState().course.courseProgress[1].completedChapters).toContain(3)
  })

  it("should initialize course state", () => {
    store.dispatch(initializeCourseState({ courseId: 1, courseSlug: "test-course", initialVideoId: "testVideo" }))
    expect(store.getState().course.currentCourseId).toEqual(1)
    expect(store.getState().course.currentCourseSlug).toEqual("test-course")
    expect(store.getState().course.currentVideoId).toEqual("testVideo")
  })

  it("should set course completion status", () => {
    store.dispatch(setCourseCompletionStatus(true))
    expect(store.getState().course.courseCompletionStatus).toEqual(true)
  })

  it("should set playback settings", () => {
    const settings = { volume: 0.5, muted: true, playbackSpeed: 1.5 }
    store.dispatch(setPlaybackSettings(settings))
    expect(store.getState().course.playbackSettings).toEqual(settings)
  })

  it("should reset course state", () => {
    store.dispatch(initializeCourseState({ courseId: 1, courseSlug: "test-course", initialVideoId: "testVideo" }))
    store.dispatch(setCourseCompletionStatus(true))
    store.dispatch(resetCourseState())
    expect(store.getState().course).toEqual({
      currentVideoId: null,
      videoProgress: {},
      autoplayEnabled: true,
      bookmarks: {},
      courseProgress: {},
      userProgress: {},
      guestProgress: {},
      currentCourseId: null,
      currentCourseSlug: null,
      courseCompletionStatus: false,
      playbackSettings: {
        volume: 0.8,
        muted: false,
        playbackSpeed: 1.0,
      },
      userPlaybackSettings: {},
      guestPlaybackSettings: {
        volume: 0.8,
        muted: false,
        playbackSpeed: 1.0,
      },
      nextVideoId: null,
      prevVideoId: null,
      isLoading: true,
      videoCache: undefined,
      performanceSettings: undefined,
      userPreferences: undefined,
      analytics: undefined,
    })
  })

  it("should cache video data", () => {
    const videoData = { title: "Test Video", description: "Test Description" }
    store.dispatch(cacheVideoData({ videoId: "testVideo", data: videoData }))
    expect(store.getState().course.videoCache["testVideo"].title).toEqual("Test Video")
  })

  it("should set performance settings", () => {
    const performanceSettings = { quality: "high", bufferSize: 2 }
    store.dispatch(setPerformanceSettings(performanceSettings))
    expect(store.getState().course.performanceSettings).toEqual(performanceSettings)
  })

  it("should set user preferences", () => {
    const userPreferences = { theme: "dark", notifications: true }
    store.dispatch(setUserPreferences(userPreferences))
    expect(store.getState().course.userPreferences).toEqual(userPreferences)
  })

  it("should track analytics events", () => {
    const analyticsEvent = { eventType: "video_start", data: { videoId: "testVideo" } }
    store.dispatch(trackAnalytics(analyticsEvent))
    expect(store.getState().course.analytics.events[0].eventType).toEqual("video_start")
  })

  it("should update user progress", () => {
    const userId = "testUser"
    const courseId = 1
    const progressData = {
      courseId: 1,
      progress: 0.75,
      completedChapters: [1, 2],
      currentChapterId: 3,
      isCompleted: false,
      lastPlayedAt: "2023-01-01T00:00:00.000Z",
      resumePoint: 45,
    }
    store.dispatch(updateUserProgress({ userId, courseId, progress: progressData }))
    expect(store.getState().course.userProgress[userId][courseId]).toEqual(progressData)
  })

  it("should set user playback settings", () => {
    const userId = "testUser"
    const settings = { volume: 0.5, muted: true, playbackSpeed: 1.5 }
    store.dispatch(setUserPlaybackSettings({ userId, settings }))
    expect(store.getState().course.userPlaybackSettings[userId]).toEqual(settings)
  })

  it("should initialize guest progress", () => {
    const courseId = 1
    const progressData = {
      courseId: 1,
      progress: 0.75,
      completedChapters: [1, 2],
      currentChapterId: 3,
      isCompleted: false,
      lastPlayedAt: "2023-01-01T00:00:00.000Z",
      resumePoint: 45,
    }
    store.dispatch(initializeGuestProgress({ courseId, progress: progressData }))
    expect(store.getState().course.guestProgress[courseId]).toEqual(progressData)
  })

  it("should set guest playback settings", () => {
    const settings = { volume: 0.5, muted: true, playbackSpeed: 1.5 }
    store.dispatch(setGuestPlaybackSettings(settings))
    expect(store.getState().course.guestPlaybackSettings).toEqual(settings)
  })

  it("should set next video ID", () => {
    store.dispatch(setNextVideoId("nextVideo"))
    expect(store.getState().course.nextVideoId).toEqual("nextVideo")
  })

  it("should set previous video ID", () => {
    store.dispatch(setPrevVideoId("prevVideo"))
    expect(store.getState().course.prevVideoId).toEqual("prevVideo")
  })

  it("should set loading state", () => {
    store.dispatch(setLoading(false))
    expect(store.getState().course.isLoading).toEqual(false)
  })
})
