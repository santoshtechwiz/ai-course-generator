import { FullCourseType, FullChapterType } from "@/app/types/course-types";
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount";
import { GuestProgressIndicator, ContextualSignInPrompt } from "@/components/guest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { setCurrentVideoApi } from "@/store/slices/course-slice";
import { formatDuration } from "date-fns";
import { BookOpen, Clock, Play, CheckCircle, Menu, X, Star, Zap } from "lucide-react";
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
// Add a global loading spinner
const GlobalLoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
  </div>
)
const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)
export const CourseStatBadge = ({ icon: Icon, value, label }: { icon: any; value: string; label: string }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
    <Icon className="h-4 w-4 text-black flex-shrink-0" />
    <div className="flex flex-col leading-tight">
      <span className="text-xs font-black text-black">{value}</span>
      <span className="text-[10px] font-bold text-gray-700 uppercase">{label}</span>
    </div>
  </div>
)
export function renderCourseDashboard(course: FullCourseType, authPromptOverlay, state: ComponentState, enhancedCourseStats: { totalVideos: number; completedVideos: any; totalDuration: string; progressPercentage: number }, dispatch2: React.Dispatch<ComponentAction>, isOwner: boolean, user: User | null, dispatch, currentChapter: FullChapterType | undefined, currentIndex: number, videoPlaylist: { videoId: string; chapter: FullChapterType }[], totalCourseDuration: number, isPiPActive: boolean, currentVideoId: string | null, bookmarkItems: BookmarkData[], handleVideoProgress: (progressState: { played: number; playedSeconds: number }) => void, handleVideoEnded: () => void, handleVideoLoad: (metadata: { duration: number; title: string }) => void, handlePlayerReady: (player: React.RefObject<any>) => void, handlePIPToggle: (activatePiP?: boolean, currentTime?: number) => void, handleTheaterModeToggle: (newTheaterMode: boolean) => void, courseProgress: any, handleAutoplayToggle: () => void, handleNextVideo: () => Promise<void>, nextVideoId: string | null, nextVideoTitle: string, hasNextVideo: boolean, videoDurations: Record<string, number>, handleSeekToBookmark: (time: number, title?: string) => void, completedChapters: any, sidebarCourse: { id: string; title: string; chapters: { id: string; title: string; videoId: string | undefined; duration: number | undefined; isFree: boolean | undefined }[] }, sidebarCurrentChapter: { id: string; title: string; videoId: string | undefined; duration: number | undefined; isFree: boolean | undefined } | null, userSubscription: string | null, courseStats: { completedCount: any; totalChapters: number; progressPercentage: number }, handleChapterSelect: (chapter: { id: string | number; title: string; videoId?: string; isFree?: boolean }) => void, progressByVideoId: Record<string, number>, handleProgressUpdate: (chapterId: string, progress: number) => void, handleChapterComplete: (chapterId: string) => void, progressLoading: boolean, chapterLastPositions: Record<string, number>, ChapterProgressBar, router): React.ReactNode {
  return <div className="min-h-screen bg-background text-foreground transition-colors duration-200 dark:bg-background dark:text-foreground">
    {/* Share course notice banner */}
    {course.isShared && (
      <div className="bg-blue-300 dark:bg-blue-900 border-b-4 border-black dark:border-white p-3 sm:p-4 transition-colors">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
          <p className="text-xs sm:text-sm font-black text-black dark:text-white uppercase tracking-tight">
            📚 Shared Course Preview — Watch all videos • Take quiz • Save bookmarks (local only)
          </p>
        </div>
      </div>
    )}

    {authPromptOverlay}

    <header
      className={cn(
        "sticky top-0 z-50 bg-background dark:bg-background border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-300",
        state.headerCompact && "py-2"
      )}
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 py-2 sm:py-3">
          {/* Left: Course title and progress */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 dark:bg-yellow-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-black dark:text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className={cn(
                  "font-black uppercase tracking-tight truncate text-black dark:text-white",
                  state.headerCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl lg:text-2xl"
                )}
              >
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs sm:text-sm font-black text-gray-700 dark:text-gray-300 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{enhancedCourseStats.totalDuration}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  <span>{enhancedCourseStats.totalVideos} videos</span>
                </div>
                {state.headerCompact && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      {enhancedCourseStats.completedVideos}/{enhancedCourseStats.totalVideos}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Enhanced Progress - Hidden on mobile */}
          {!state.headerCompact && (
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              <div className="flex items-center gap-2 bg-background dark:bg-background border-2 border-black dark:border-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-black text-xs">
                    {enhancedCourseStats.completedVideos}/{enhancedCourseStats.totalVideos}
                  </span>
                </div>
                <div className="w-24 h-2 bg-gray-300 dark:bg-gray-600 border border-black dark:border-white">
                  <div
                    className="h-full bg-green-600 dark:bg-green-500 transition-all duration-300"
                    style={{ width: `${enhancedCourseStats.progressPercentage}%` }} />
                </div>
                <div className="font-black text-xs min-w-[35px] text-center">
                  {enhancedCourseStats.progressPercentage}%
                </div>
              </div>
            </div>
          )}

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => dispatch2({ type: "SET_SIDEBAR_COLLAPSED", payload: !state.sidebarCollapsed })}
              className="hidden xl:flex bg-blue-400 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 text-black dark:text-white font-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all uppercase text-xs"
            >
              {state.sidebarCollapsed ? (
                <>
                  <Menu className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Show</span>
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Hide</span>
                </>
              )}
            </Button>
            <ActionButtons
              slug={course.slug}
              isOwner={isOwner}
              variant="compact"
              title={course.title}
              courseId={course.id} />
          </div>
        </div>

        <div className="xl:hidden border-t-2 border-black dark:border-white pt-2 pb-1.5">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-black dark:text-white">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span>
                {enhancedCourseStats.completedVideos}/{enhancedCourseStats.totalVideos}
              </span>
            </div>
            <div className="bg-background dark:bg-background border-2 border-black dark:border-white px-2 py-0.5 font-black text-xs text-black dark:text-white">
              {enhancedCourseStats.progressPercentage}%
            </div>
          </div>
          <div className="h-2 bg-gray-300 dark:bg-gray-600 border border-black dark:border-white">
            <div
              className="h-full bg-green-600 dark:bg-green-500 transition-all duration-300"
              style={{ width: `${enhancedCourseStats.progressPercentage}%` }} />
          </div>
        </div>
      </div>
    </header>

    {/* Video generation section for owners */}

    <VideoGenerationSection
      course={course}
      isOwner={isOwner}
      isAdmin={user?.isAdmin ?? false}
      onVideoGenerated={(chapterId, videoId) => {
        if (videoId) {
          dispatch(setCurrentVideoApi(videoId))
        }
      } } />




    {!state.isTheaterMode && (
      <div className="xl:hidden border-b-4 border-black dark:border-white bg-gray-100 dark:bg-gray-900">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <Button
            variant="neutral"
            onClick={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: !state.mobilePlaylistOpen })}
            className="w-full justify-between h-12 sm:h-14 bg-background dark:bg-background border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all font-black text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-black uppercase text-xs sm:text-sm">Content</div>
                <div className="text-xs font-bold text-gray-600 dark:text-gray-400 line-clamp-1">
                  {currentChapter?.title || "Select chapter"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <MobilePlaylistCount
                currentIndex={currentIndex}
                hasCurrentChapter={Boolean(currentChapter)}
                total={videoPlaylist.length} />
              <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full"></div>
            </div>
          </Button>
        </div>
      </div>
    )}

    <main className={cn("transition-all duration-100", state.isTheaterMode && "bg-black")}>
      {!state.isTheaterMode ? (
        <div className="h-12 sm:h-16" />
      ) : null}

      <div
        className={cn(
          "mx-auto transition-all duration-100",
          state.isTheaterMode ? "max-w-none px-0" : "max-w-[1600px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4"
        )}
      >
        {!state.isTheaterMode && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <CourseStatBadge icon={Play} value={videoPlaylist.length.toString()} label="Videos" />
            <CourseStatBadge icon={Clock} value={formatDuration(totalCourseDuration)} label="Duration" />
            <CourseStatBadge icon={CheckCircle} value={`${enhancedCourseStats.progressPercentage}%`} label="Done" />
            {course.rating && <CourseStatBadge icon={Star} value={course.rating.toString()} label="Rating" />}
          </div>
        )}

        <div
          className={cn(
            "transition-all duration-100",
            state.sidebarCollapsed || state.isTheaterMode
              ? "flex flex-col"
              : "flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-2 sm:gap-3 xl:gap-4"
          )}
        >
          {/* Video and content area */}
          <div className="space-y-2 sm:space-y-3 min-w-0">
            {/* Guest Progress Indicator */}
            {!user && (
              <div className="mb-2 sm:mb-3 transition-transform duration-100">
                <GuestProgressIndicator courseId={course.id} />
              </div>
            )}

            <div className="relative">
              {isPiPActive ? (
                <div className="bg-gray-100 dark:bg-gray-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center p-4 sm:p-8">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-blue-400 dark:bg-blue-600 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center">
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-black dark:text-white" />
                      </div>
                      <h3 className="text-base sm:text-xl font-black mb-1 sm:mb-2 uppercase tracking-tight text-black dark:text-white">
                        Picture-in-Picture
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-bold">
                        Video playing in separate window
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-black overflow-hidden border-4 border-black dark:border-white">
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
                        if (courseProgress?.videoProgress?.playedSeconds &&
                          String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)) {
                          const ts = Number(courseProgress.videoProgress.playedSeconds)
                          if (!isNaN(ts) && ts > 0) return ts
                        }
                      } catch { }
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
                    playbackSpeedOptions={[0.5, 1, 1.5, 2]} // Add playback speed options
                    subtitleOptions={["English", "Spanish", "French"]} // Add subtitle options
                    qualityOptions={["360p", "720p", "1080p"]} // Add quality selection options
                    onPlaybackSpeedChange={(speed) => console.log(`Playback speed changed to: ${speed}`)}
                    onSubtitleChange={(subtitle) => console.log(`Subtitle changed to: ${subtitle}`)}
                    onQualityChange={(quality) => console.log(`Quality changed to: ${quality}`)} />
                </div>
              )}
            </div>

            {!state.isTheaterMode && currentChapter && (
              <div className="bg-background dark:bg-background border border-border shadow-neo p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-black text-sm sm:text-base lg:text-lg uppercase tracking-tight truncate text-black dark:text-white">
                      {currentChapter.title}
                    </h2>
                    {currentChapter.description && (
                      <p className="text-gray-600 dark:text-gray-400 font-bold text-xs sm:text-sm mt-0.5 line-clamp-1">
                        {currentChapter.description}
                      </p>
                    )}
                  </div>
                  {videoDurations[currentVideoId || ""] && (
                    <div className="bg-[var(--color-warning)] border-2 border-black dark:border-white px-2 py-1 font-black text-xs whitespace-nowrap flex-shrink-0">
                      {formatDuration(videoDurations[currentVideoId || ""])}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contextual Sign-In Prompt */}
            {!user && (
              <div className="bg-[var(--color-info)]/20 dark:bg-[var(--color-info)]/10 border-4 border-black dark:border-white p-2.5 sm:p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <ContextualSignInPrompt action="continue_course" courseId={String(course.id)} />
              </div>
            )}

            {!state.isTheaterMode && (
              <div className="transition-all duration-100">
                <div className="border-4 border-border shadow-neo bg-card">
                  <div className="p-2.5 sm:p-3">
                    <MemoizedCourseDetailsTabs
                      course={course}
                      currentChapter={currentChapter}
                      onSeekToBookmark={handleSeekToBookmark}
                      completedChapters={completedChapters} />
                  </div>
                </div>
              </div>
            )}

            {!state.isTheaterMode && (
              <div className="transition-all duration-100">
                <div className="border-4 border-border shadow-neo bg-card">
                  <div className="p-2.5 sm:p-3">
                    <ReviewsSection slug={course.slug} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!state.sidebarCollapsed && !state.isTheaterMode && (
            <div className="hidden xl:block space-y-2 sm:space-y-3 min-w-0 w-full">
              <div className="border-4 border-border shadow-neo bg-card h-full overflow-hidden">
                <div className="p-0">
                  {sidebarCourse.chapters.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                      <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-black dark:text-white" />
                      <h3 className="font-black text-base sm:text-lg mb-2 uppercase text-black dark:text-white">
                        No Videos
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-bold">
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
                      )} />
                  )}
                </div>
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
        closeButton={<button
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded"
          onClick={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: false })}
          aria-label="Close playlist"
        >
          Close
        </button>}
        swipeToClose />
    )}

    {!userSubscription && !state.isTheaterMode && (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 xl:bottom-8 xl:right-8 z-40 transition-transform duration-200">
        <Button
          size="lg"
          onClick={() => (window.location.href = "/dashboard/subscription")}
          className="bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-black dark:text-white font-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all uppercase px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
        >
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Unlock All</span>
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
      totalLessons={videoPlaylist.length} />

    {/* Debug component */}
    {process.env.NODE_ENV !== "production" && (
      <div className="fixed bottom-4 left-4 xl:bottom-8 xl:left-8 z-50">
        <VideoDebug
          videoId={currentVideoId || ""}
          courseId={course.id}
          chapterId={currentChapter?.id ? String(currentChapter.id) : ""} />
      </div>
    )}

    {/* Global loading spinner */}
    {state.isVideoLoading && <GlobalLoadingSpinner />}

    {/* Add autoplay feedback indicator */}
    <div className="autoplay-indicator">
      <button
        onClick={handleAutoplayToggle}
        className={`autoplay-toggle ${state.autoplayMode ? 'active' : ''}`}
        aria-label={state.autoplayMode ? "Disable autoplay" : "Enable autoplay"}
      >
        {state.autoplayMode ? 'Autoplay: On' : 'Autoplay: Off'}
      </button>
    </div>

    {/* Add an exit button for theater mode */}
    {state.isTheaterMode && (
      <button
        onClick={() => dispatch2({ type: "SET_THEATER_MODE", payload: false })}
        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded shadow-lg"
        aria-label="Exit Theater Mode"
      >
        Exit Theater Mode
      </button>
    )}

    {/* Add a description for guest users to encourage signing in */}
    {!user && (
      <div className="bg-blue-100 border border-blue-300 p-4 rounded-none text-center">
        <h2 className="text-lg font-bold text-blue-800">Sign in to unlock more features!</h2>
        <p className="text-sm text-blue-700 mt-2">
          By signing in, you can save your progress, access premium content, and enjoy a personalized learning experience.
        </p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-none hover:bg-blue-600"
        >
          Sign In Now
        </button>
      </div>
    )}
  </div>
}

