import { FullCourseType, FullChapterType } from "@/app/types/course-types";
import { GuestProgressIndicator, ContextualSignInPrompt } from "@/components/guest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { setCurrentVideoApi } from "@/store/slices/course-slice";
import { BookOpen, Play, X, Star, Zap, Award, TrendingUp } from "lucide-react";
import { User } from "next-auth";
import React from "react";
import CertificateModal from "./CertificateModal";
import MobilePlaylistOverlay from "./MobilePlaylistOverlay";
import ReviewsSection from "./ReviewsSection";
import { VideoDebug } from "./video/components/VideoDebug";
import VideoPlayer from "./video/components/VideoPlayer";
import { BookmarkData } from "./video/types";
import VideoGenerationSection from "./VideoGenerationSection";
import VideoNavigationSidebar from "./ChapterPlaylist"
import CourseDetailsTabs from "./CourseDetailsTabs";
// ✅ PHASE 2: Extracted components
import { CourseHeader } from "./CourseHeader";
import { SharedCourseBanner } from "./SharedCourseBanner";
import { MobilePlaylistToggle } from "./MobilePlaylistToggle";

const MemoizedCourseDetailsTabs = React.memo(CourseDetailsTabs)

// Component State Types
export interface ComponentState {
  showCertificate: boolean
  autoplayMode: boolean
  isTheaterMode: boolean
  isVideoLoading: boolean
  mobilePlaylistOpen: boolean
  sidebarCollapsed: boolean
  authPromptVisible: boolean
  headerCompact: boolean
  mounted: boolean
  freeVideoPlayed: boolean
}

export type ComponentAction =
  | { type: "SET_CERTIFICATE_VISIBLE"; payload: boolean }
  | { type: "SET_AUTOPLAY_MODE"; payload: boolean }
  | { type: "SET_THEATER_MODE"; payload: boolean }
  | { type: "SET_VIDEO_LOADING"; payload: boolean }
  | { type: "SET_MOBILE_PLAYLIST_OPEN"; payload: boolean }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_AUTH_PROMPT"; payload: boolean }
  | { type: "SET_HEADER_COMPACT"; payload: boolean }
  | { type: "SET_MOUNTED"; payload: boolean }
  | { type: "SET_FREE_VIDEO_PLAYED"; payload: boolean }


export function renderCourseDashboard(
  course: FullCourseType,
  authPromptOverlay: React.ReactNode,
  state: ComponentState,
  enhancedCourseStats: { totalVideos: number; completedVideos: any; totalDuration: string; progressPercentage: number },
  dispatch2: React.Dispatch<ComponentAction>,
  dispatch: any,
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
  handleSeekToBookmark: (time: number) => void,
  completedChapters: string[],
  sidebarCourse: any,
  sidebarCurrentChapter: any,
  userSubscription: any,
  courseStats: any,
  handleChapterSelect: (videoId: string) => void,
  progressByVideoId: Record<string, number>,
  handleProgressUpdate: (chapterId: string, progress: number) => void,
  handleChapterComplete: (chapterId: number) => Promise<void>,
  progressLoading: boolean,
  chapterLastPositions: Record<string, number>,
  router: any,
  // ✅ PHASE 3: Context object to reduce parameters
  contextData?: {
    user: User | null;
    isOwner: boolean;
    isGuest: boolean;
    canPlayVideo: boolean;
  }
): React.ReactNode {
  // Extract context data with fallbacks for backward compatibility
  const { 
    user = null,
    isOwner = false,
    isGuest = false,
    canPlayVideo = false
  } = contextData || {}
  
  // Helper to format seconds to readable duration
  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }
  
  // Wrapper for handleChapterSelect to match VideoNavigationSidebar signature
  const handleChapterSelectWrapper = (chapter: any) => {
    if (chapter && chapter.videoId) {
      handleChapterSelect(chapter.videoId)
    }
  }
  
  // Wrapper for handleChapterComplete to match VideoNavigationSidebar signature  
  const handleChapterCompleteWrapper = (chapterId: string) => {
    handleChapterComplete(Number(chapterId))
  }
  
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-200">
      {/* ===== SHARED COURSE BANNER ===== */}
      <SharedCourseBanner isShared={Boolean(course.isShared)} />

      {authPromptOverlay}

      {/* ===== STICKY HEADER ===== */}
      <CourseHeader
        course={course}
        isShared={Boolean(course.isShared)}
        isOwner={isOwner}
        stats={enhancedCourseStats}
        sidebarCollapsed={state.sidebarCollapsed}
        onToggleSidebar={() => dispatch2({ type: "SET_SIDEBAR_COLLAPSED", payload: !state.sidebarCollapsed })}
      />

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
        <MobilePlaylistToggle
          currentChapter={currentChapter}
          currentIndex={currentIndex}
          totalVideos={videoPlaylist.length}
          isOpen={state.mobilePlaylistOpen}
          onToggle={() => dispatch2({ type: "SET_MOBILE_PLAYLIST_OPEN", payload: !state.mobilePlaylistOpen })}
        />
      )}

      <main className={cn("transition-all duration-200", state.isTheaterMode && "bg-[hsl(var(--background))]")}>
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
                  <div className="bg-gradient-to-b from-[hsl(var(--muted))] to-[hsl(var(--muted))]/80 border-4 border-[hsl(var(--border))] shadow-neo overflow-hidden">
                    <div className="aspect-video bg-[hsl(var(--muted))] flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-3 bg-[hsl(var(--accent))] border-4 border-[hsl(var(--border))] shadow-neo flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-[hsl(var(--foreground))] fill-current" />
                        </div>
                        <h3 className="text-lg font-black mb-1.5 uppercase tracking-tight text-[hsl(var(--foreground))]">
                          Picture-in-Picture Active
                        </h3>
                        <p className="text-sm text-[hsl(var(--foreground))]/80 font-bold">
                          Video playing in separate window
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-[hsl(var(--background))] border-4 border-[hsl(var(--border))] shadow-neo overflow-hidden">
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
                      progressStats={{
                        completedCount: courseStats.completedCount,
                        totalChapters: courseStats.totalChapters,
                        progressPercentage: courseStats.progressPercentage
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ===== CHAPTER INFO CARD ===== */}
              {!state.isTheaterMode && currentChapter && (
                <section className="bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo p-4 hover:shadow-neo-hover transition-shadow duration-200 rounded-none" aria-labelledby="current-chapter-title">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 id="current-chapter-title" className="font-black text-base sm:text-lg uppercase tracking-tight text-[hsl(var(--foreground))] mb-2">
                        {currentChapter.title}
                      </h2>
                      {currentChapter.description && (
                        <p className="text-[hsl(var(--foreground))]/80 font-medium text-sm line-clamp-2 leading-relaxed">
                          {currentChapter.description}
                        </p>
                      )}
                    </div>
                    {videoDurations[currentVideoId || ""] && (
                      <div className="bg-[hsl(var(--warning))] border-3 border-[hsl(var(--border))] px-3 py-2 font-black text-sm whitespace-nowrap flex-shrink-0 shadow-neo hover:shadow-neo-hover transition-shadow rounded-none" aria-label={`Duration: ${formatSeconds(videoDurations[currentVideoId || ""])}`}>
                        <div className="text-[hsl(var(--foreground))]">{formatSeconds(videoDurations[currentVideoId || ""])}</div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Sign-in prompt for guests */}
              {!user && !state.isTheaterMode && (
                <div className="bg-[hsl(var(--accent))]/10 border-3 border-[hsl(var(--accent))]/30 p-4 shadow-neo rounded-none hover:shadow-neo-hover transition-shadow duration-200">
                  <ContextualSignInPrompt action="continue_course" courseId={String(course.id)} />
                </div>
              )}

              {/* Course details tabs */}
              {!state.isTheaterMode && (
                <div className="bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover transition-shadow duration-200 rounded-none overflow-hidden">
                  <div className="p-4">
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
                <div className="bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover transition-shadow duration-200 rounded-none overflow-hidden">
                  <div className="p-4">
                    <ReviewsSection slug={course.slug} />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            {!state.sidebarCollapsed && !state.isTheaterMode && (
              <div className="hidden xl:block space-y-4 min-w-0">
                <div className="bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo overflow-hidden sticky top-20 rounded-none hover:shadow-neo-hover transition-shadow duration-200">
                  {sidebarCourse.chapters.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-3 bg-[hsl(var(--muted))] border-3 border-[hsl(var(--border))] flex items-center justify-center rounded-none shadow-neo-sm">
                        <BookOpen className="h-7 w-7 text-[hsl(var(--foreground))]/60" />
                      </div>
                      <h3 className="font-black text-base mb-2 uppercase text-[hsl(var(--foreground))]">No Videos Yet</h3>
                      <p className="text-sm text-[hsl(var(--foreground))]/60 font-bold">
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
                      formatDuration={formatSeconds}
                      videoDurations={videoDurations}
                      courseStats={courseStats}
                      onChapterSelect={handleChapterSelectWrapper}
                      progress={progressByVideoId}
                      onProgressUpdate={handleProgressUpdate}
                      onChapterComplete={handleChapterCompleteWrapper}
                      isProgressLoading={progressLoading}
                      lastPositions={chapterLastPositions}
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
          currentVideoId={currentVideoId || ""}
          isAuthenticated={!!user}
          userSubscription={userSubscription || null}
          completedChapters={completedChapters.map(String)}
          formatDuration={formatSeconds}
          videoDurations={videoDurations}
          courseStats={courseStats}
          onChapterSelect={handleChapterSelectWrapper}
        />
      )}

      {/* ===== UNLOCK PREMIUM CTA ===== */}
      {!userSubscription && !state.isTheaterMode && (
        <div className="fixed bottom-6 right-6 z-40 transition-all duration-200 hover:scale-105 hover:-translate-y-1">
          <Button
            size="lg"
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-[hsl(var(--foreground))] font-black border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-neo-active transition-all uppercase px-6 py-3 text-sm rounded-none group"
          >
            <Zap className="h-4 w-4 mr-2 fill-current group-hover:scale-110 transition-transform" />
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
        <div className="fixed bottom-6 left-6 z-40 transition-all duration-200">
          <button
            onClick={handleAutoplayToggle}
            className={cn(
              "px-4 py-2.5 font-black text-xs uppercase border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-neo-active transition-all rounded-none tracking-wider",
              state.autoplayMode
                ? "bg-[hsl(var(--success))] text-[hsl(var(--foreground))]"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]/60"
            )}
            aria-label={state.autoplayMode ? "Disable autoplay" : "Enable autoplay"}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                state.autoplayMode ? "bg-[hsl(var(--foreground))] animate-pulse" : "bg-[hsl(var(--foreground))]/40"
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
          className="fixed top-4 right-4 z-50 bg-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/90 text-[hsl(var(--primary-foreground))] px-4 py-3 border-3 border-[hsl(var(--border))] shadow-neo-heavy hover:shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-neo-active transition-all font-black uppercase text-sm rounded-none group"
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
          <div className="bg-[hsl(var(--warning))] border-3 border-[hsl(var(--border))] shadow-neo-heavy px-6 py-4 rounded-none">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-[hsl(var(--foreground))]" />
              <div className="flex-1">
                <p className="font-black text-lg uppercase text-[hsl(var(--foreground))] tracking-tight">🎉 Course Complete!</p>
                <p className="text-xs font-bold text-[hsl(var(--foreground))]/80">You've mastered this course - download your certificate!</p>
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