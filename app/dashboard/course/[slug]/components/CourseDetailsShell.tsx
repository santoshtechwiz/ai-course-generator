import { FullCourseType, FullChapterType } from "@/app/types/course-types";
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount";
import { GuestProgressIndicator, ContextualSignInPrompt } from "@/components/guest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { setCurrentVideoApi } from "@/store/slices/course-slice";
import { formatDuration } from "date-fns";
import { BookOpen, Clock, Play, CheckCircle, Menu, X, Star, Zap, ChevronDown, Award, TrendingUp } from "lucide-react";
import { User } from "next-auth";
import { ComponentState } from "react";
import ActionButtons from "./ActionButtons";
import CertificateModal from "./CertificateModal";
import MobilePlaylistOverlay from "./MobilePlaylistOverlay";
import ReviewsSection from "./ReviewsSection";
import { VideoDebug } from "./video/components/VideoDebug";
import VideoPlayer from "./video/components/VideoPlayer";
import { BookmarkData } from "./video/types";
import VideoGenerationSection from "./VideoGenerationSection";
import VideoNavigationSidebar from "./ChapterPlaylist"
import React from "react";
import CourseDetailsTabs from "./CourseDetailsTabs";

const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

// ===== IMPROVED PROGRESS RING =====
const ProgressRing = ({ percentage, size = 48 }: { percentage: number; size?: number }) => {
  const radius = (size - 8) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-gray-300 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-lime-500 dark:text-lime-400 transition-all duration-700 ease-out"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function renderCourseDashboard(
  course: FullCourseType,
  authPromptOverlay,
  state: ComponentState,
  enhancedCourseStats: { totalVideos: number; completedVideos: any; totalDuration: string; progressPercentage: number },
  dispatch2: React.Dispatch<ComponentAction>,
  isOwner: boolean,
  user: User | null,
  dispatch,
  currentChapter: FullChapterType | undefined,
  currentIndex: number,
  videoPlaylist: { videoId: string; chapter: FullChapterType }[],
  totalCourseDuration: number,
  isPiPActive: boolean,
  currentVideoId: string | null,
  bookmarkItems: BookmarkData[],
  handleVideoProgress: (progressState: { played: number; playedSeconds: number }) => void,
  handleVideoEnded: () => void,
  handleVideoLoad: (metadata: { duration: number; title: string }) => void,
  handlePlayerReady: (player: React.RefObject<any>) => void,
  handlePIPToggle: (activatePiP?: boolean, currentTime?: number) => void,
  handleTheaterModeToggle: (newTheaterMode: boolean) => void,
  courseProgress: any,
  handleAutoplayToggle: () => void,
  handleNextVideo: () => Promise<void>,
  nextVideoId: string | null,
  nextVideoTitle: string,
  hasNextVideo: boolean,
  videoDurations: Record<string, number>,
  handleSeekToBookmark: (time: number, title?: string) => void,
  completedChapters: any,
  sidebarCourse: { id: string; title: string; chapters: { id: string; title: string; videoId: string | undefined; duration: number | undefined; isFree: boolean | undefined }[] },
  sidebarCurrentChapter: { id: string; title: string; videoId: string | undefined; duration: number | undefined; isFree: boolean | undefined } | null,
  userSubscription: string | null,
  courseStats: { completedCount: any; totalChapters: number; progressPercentage: number },
  handleChapterSelect: (chapter: { id: string | number; title: string; videoId?: string; isFree?: boolean }) => void,
  progressByVideoId: Record<string, number>,
  handleProgressUpdate: (chapterId: string, progress: number) => void,
  handleChapterComplete: (chapterId: string) => void,
  progressLoading: boolean,
  chapterLastPositions: Record<string, number>,
  ChapterProgressBar,
  router
): React.ReactNode {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-foreground transition-colors duration-200">
      {/* ===== SHARED COURSE BANNER ===== */}
      {course.isShared && (
        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-600 dark:to-blue-700 border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,0.8)]">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-gray-900 border-3 border-black dark:border-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-black dark:text-white uppercase tracking-tight">
                  🌟 Shared Course Preview
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-black/70 dark:text-white/70">
                  Save bookmarks • Take quizzes • Track progress
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {authPromptOverlay}

      {/* ===== STICKY HEADER ===== */}
      <header
        className={cn(
          "sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-300"
        )}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3 py-3">
            {/* Left: Course info */}
            <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-yellow-400 dark:from-yellow-400 dark:to-yellow-500 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] flex items-center justify-center group hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-black dark:text-black group-hover:rotate-6 transition-transform" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1
                  className="font-black uppercase tracking-tight truncate text-black dark:text-white text-base sm:text-xl"
                  title={course.title}
                >
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3 flex-shrink-0" />
                    <span>{enhancedCourseStats.totalVideos}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{enhancedCourseStats.totalDuration}</span>
                  </div>
                  {enhancedCourseStats.progressPercentage > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-lime-600 dark:text-lime-400">
                        <CheckCircle className="h-3 w-3 flex-shrink-0" />
                        <span className="font-black">{enhancedCourseStats.progressPercentage}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => dispatch2({ type: "SET_SIDEBAR_COLLAPSED", payload: !state.sidebarCollapsed })}
                className="hidden xl:flex bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-black dark:text-white font-black border-3 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase text-xs h-9 rounded-none gap-1.5"
              >
                {state.sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                <span className="hidden sm:inline">{state.sidebarCollapsed ? "Playlist" : "Hide"}</span>
              </Button>
              <ActionButtons
                slug={course.slug}
                isOwner={isOwner}
                variant="compact"
                title={course.title}
                courseId={course.id}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Video generation section */}
      <VideoGenerationSection
        course={course}
        isOwner={isOwner}
        isAdmin={user?.isAdmin ?? false}
        onVideoGenerated={(chapterId, videoId) => {
          if (videoId) {
            dispatch(setCurrentVideoApi(videoId))
          }
        }}
      />

      {/* ===== MOBILE PLAYLIST TOGGLE ===== */}
      {!state.isTheaterMode && (
        <div className="xl:hidden border-b-4 border-black dark:border-white bg-white dark:bg-gray-900">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
            <Button
              variant="neutral"
              onClick={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: !state.mobilePlaylistOpen })}
              className="w-full justify-between h-12 sm:h-14 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-black rounded-none group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-cyan-500 dark:bg-cyan-600 border-3 border-black dark:border-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-4 w-4 text-black dark:text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black uppercase text-xs text-black dark:text-white">Course Content</div>
                  <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">
                    {currentChapter?.title || "Select a chapter"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <MobilePlaylistCount
                  currentIndex={currentIndex}
                  hasCurrentChapter={Boolean(currentChapter)}
                  total={videoPlaylist.length}
                />
                <ChevronDown className={cn(
                  "h-4 w-4 text-black dark:text-white transition-transform duration-200",
                  state.mobilePlaylistOpen && "rotate-180"
                )} />
              </div>
            </Button>
          </div>
        </div>
      )}

      <main className={cn("transition-all duration-200", state.isTheaterMode && "bg-black")}>
        <div
          className={cn(
            "mx-auto transition-all duration-200",
            state.isTheaterMode ? "max-w-none px-0" : "max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4"
          )}
        >
          <div
            className={cn(
              "transition-all duration-200",
              state.sidebarCollapsed || state.isTheaterMode
                ? "flex flex-col"
                : "flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-4"
            )}
          >
            {/* Main content area */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              {/* Guest progress indicator */}
              {!user && !state.isTheaterMode && (
                <div className="transition-transform duration-200 hover:scale-[1.01]">
                  <GuestProgressIndicator courseId={course.id} />
                </div>
              )}

              {/* ===== VIDEO PLAYER ===== */}
              <div className="relative group">
                {isPiPActive ? (
                  <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                    <div className="aspect-video bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-3 bg-cyan-500 dark:bg-cyan-600 border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-black dark:text-white fill-black dark:fill-white" />
                        </div>
                        <h3 className="text-lg font-black mb-1.5 uppercase tracking-tight text-black dark:text-white">
                          Picture-in-Picture Active
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">
                          Video playing in separate window
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-black border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                    <VideoPlayer
                      youtubeVideoId={currentVideoId || ""}
                      chapterId={currentChapter?.id ? String(currentChapter.id) : ""}
                      chapterTitle={currentChapter?.title || ""}
                      bookmarks={bookmarkItems}
                      onProgress={handleVideoProgress}
                      onEnded={handleVideoEnded}
                      onVideoLoad={handleVideoLoad}
                      onPlayerReady={handlePlayerReady}
                      onPictureInPictureToggle={handlePIPToggle}
                      isPiPActive={isPiPActive}
                      onTheaterModeToggle={handleTheaterModeToggle}
                      isTheaterMode={state.isTheaterMode}
                      isLoading={state.isVideoLoading}
                      initialSeekSeconds={(() => {
                        try {
                          if (
                            courseProgress?.videoProgress?.playedSeconds &&
                            String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)
                          ) {
                            const ts = Number(courseProgress.videoProgress.playedSeconds)
                            if (!isNaN(ts) && ts > 0) return ts
                          }
                        } catch {}
                        return undefined
                      })()}
                      courseId={course.id}
                      courseName={course.title}
                      autoPlay={state.autoplayMode}
                      onToggleAutoPlay={handleAutoplayToggle}
                      onNextVideo={handleNextVideo}
                      nextVideoId={nextVideoId || undefined}
                      nextVideoTitle={nextVideoTitle}
                      hasNextVideo={hasNextVideo}
                      autoAdvanceNext={state.autoplayMode}
                      playbackSpeedOptions={[0.5, 1, 1.5, 2]}
                      subtitleOptions={["English", "Spanish", "French"]}
                      qualityOptions={["360p", "720p", "1080p"]}
                      onPlaybackSpeedChange={(speed) => console.log(`Playback speed: ${speed}`)}
                      onSubtitleChange={(subtitle) => console.log(`Subtitle: ${subtitle}`)}
                      onQualityChange={(quality) => console.log(`Quality: ${quality}`)}
                    />
                  </div>
                )}
              </div>

              {/* ===== CHAPTER INFO CARD ===== */}
              {!state.isTheaterMode && currentChapter && (
                <div className="bg-white dark:bg-gray-900 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] p-3 sm:p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-200 rounded-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-black text-base sm:text-lg uppercase tracking-tight text-black dark:text-white mb-1.5">
                        {currentChapter.title}
                      </h2>
                      {currentChapter.description && (
                        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm line-clamp-2 leading-relaxed">
                          {currentChapter.description}
                        </p>
                      )}
                    </div>
                    {videoDurations[currentVideoId || ""] && (
                      <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 dark:from-yellow-400 dark:to-yellow-500 border-3 border-black dark:border-white px-3 py-2 font-black text-sm whitespace-nowrap flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow rounded-none">
                        <div className="text-black dark:text-black">{formatDuration(videoDurations[currentVideoId || ""])}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sign-in prompt for guests */}
              {!user && !state.isTheaterMode && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-3 border-blue-300 dark:border-blue-600 p-3 sm:p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] rounded-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-shadow duration-200">
                  <ContextualSignInPrompt action="continue_course" courseId={String(course.id)} />
                </div>
              )}

              {/* Course details tabs */}
              {!state.isTheaterMode && (
                <div className="bg-white dark:bg-gray-900 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-200 rounded-none overflow-hidden">
                  <div className="p-3 sm:p-4">
                    <MemoizedCourseDetailsTabs
                      course={course}
                      currentChapter={currentChapter}
                      onSeekToBookmark={handleSeekToBookmark}
                      completedChapters={completedChapters}
                    />
                  </div>
                </div>
              )}

              {/* Reviews section */}
              {!state.isTheaterMode && (
                <div className="bg-white dark:bg-gray-900 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-200 rounded-none overflow-hidden">
                  <div className="p-3 sm:p-4">
                    <ReviewsSection slug={course.slug} />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            {!state.sidebarCollapsed && !state.isTheaterMode && (
              <div className="hidden xl:block space-y-3 min-w-0">
                <div className="bg-white dark:bg-gray-900 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] overflow-hidden sticky top-20 rounded-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-200">
                  {sidebarCourse.chapters.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 border-3 border-black dark:border-white flex items-center justify-center rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                        <BookOpen className="h-7 w-7 text-gray-400 dark:text-gray-600" />
                      </div>
                      <h3 className="font-black text-base mb-1.5 uppercase text-black dark:text-white">No Videos Yet</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                        This course doesn't have video content yet.
                      </p>
                    </div>
                  ) : (
                    <VideoNavigationSidebar
                      course={sidebarCourse}
                      currentChapter={sidebarCurrentChapter}
                      courseId={course.id.toString()}
                      currentVideoId={currentVideoId || ""}
                      isAuthenticated={!!user}
                      userSubscription={userSubscription || null}
                      completedChapters={completedChapters.map(String)}
                      formatDuration={formatDuration}
                      videoDurations={videoDurations}
                      courseStats={courseStats}
                      onChapterSelect={handleChapterSelect}
                      progress={progressByVideoId}
                      onProgressUpdate={handleProgressUpdate}
                      onChapterComplete={handleChapterComplete}
                      isProgressLoading={progressLoading}
                      lastPositions={chapterLastPositions}
                      renderChapter={(chapter) => (
                        <div>
                          <span>{chapter.title}</span>
                          <ChapterProgressBar progress={progressByVideoId[chapter.videoId] || 0} />
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile playlist overlay */}
      {!state.isTheaterMode && (
        <MobilePlaylistOverlay
          isOpen={state.mobilePlaylistOpen}
          onClose={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })}
          course={sidebarCourse}
          currentChapter={sidebarCurrentChapter}
          courseId={course.id.toString()}
          currentVideoId={currentVideoId}
          isAuthenticated={!!user}
          userSubscription={userSubscription || null}
          completedChapters={completedChapters.map(String)}
          formatDuration={formatDuration}
          videoDurations={videoDurations}
          courseStats={courseStats}
          onChapterSelect={handleChapterSelect}
          closeButton={
            <button
              className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2.5 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-all font-black uppercase text-xs rounded-none"
              onClick={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })}
              aria-label="Close playlist"
            >
              <X className="h-4 w-4" />
            </button>
          }
          swipeToClose
        />
      )}

      {/* ===== UNLOCK PREMIUM CTA ===== */}
      {!userSubscription && !state.isTheaterMode && (
        <div className="fixed bottom-5 right-5 z-40 transition-all duration-200 hover:scale-105 hover:-translate-y-1">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-black font-black border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all uppercase px-5 py-2.5 text-sm rounded-none group"
          >
            <Zap className="h-4 w-4 mr-1.5 fill-black text-black group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Unlock All Content</span>
            <span className="sm:hidden">Unlock</span>
          </Button>
        </div>
      )}

      {/* Certificate modal */}
      <CertificateModal
        show={state.showCertificate}
        onClose={() => dispatch2({ type: "SET_CERTIFICATE_VISIBLE", payload: false })}
        courseId={course.id}
        courseTitle={course.title}
        userName={user?.name || null}
        totalLessons={videoPlaylist.length}
      />

      {/* ===== AUTOPLAY INDICATOR ===== */}
      {!state.isTheaterMode && (
        <div className="fixed bottom-5 left-5 z-40 transition-all duration-200">
          <button
            onClick={handleAutoplayToggle}
            className={cn(
              "px-3.5 py-2 font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] transition-all rounded-none tracking-wider",
              state.autoplayMode
                ? "bg-lime-400 hover:bg-lime-500 text-black border-black"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-white"
            )}
            aria-label={state.autoplayMode ? "Disable autoplay" : "Enable autoplay"}
          >
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                state.autoplayMode ? "bg-black animate-pulse" : "bg-gray-500"
              )} />
              <span>Autoplay: {state.autoplayMode ? "ON" : "OFF"}</span>
            </div>
          </button>
        </div>
      )}

      {/* ===== THEATER MODE EXIT BUTTON ===== */}
      {state.isTheaterMode && (
        <button
          onClick={() => dispatch2({ type: "SET_THEATER_MODE", payload: false })}
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-3 border-3 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all font-black uppercase text-sm rounded-none group"
          aria-label="Exit Theater Mode"
        >
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">Exit Theater</span>
            <span className="sm:hidden">Exit</span>
          </div>
        </button>
      )}

      {/* ===== COMPLETION CELEBRATION BANNER ===== */}
      {enhancedCourseStats.progressPercentage === 100 && !state.isTheaterMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-5 py-3.5 rounded-none">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-black animate-spin" />
              <div>
                <p className="font-black text-lg uppercase text-black tracking-tight">🎉 Course Complete!</p>
                <p className="text-xs font-bold text-black/80">You've mastered this course</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug component (dev only) */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-20 left-5 z-50">
          <VideoDebug
            videoId={currentVideoId || ""}
            courseId={course.id}
            chapterId={currentChapter?.id ? String(currentChapter.id) : ""}
          />
        </div>
      )}
    </div>
  )
}