"use client";

import type React from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Menu,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Import existing components
import VideoPlayer from "./video/components/VideoPlayer";
import VideoNavigationSidebar from "./video/components/VideoNavigationSidebar";
import CourseDetailsTabs from "./CourseDetailsTabs";
import CertificateGenerator from "./CertificateGenerator";
import AnimatedCourseAILogo from "./video/components/AnimatedCourseAILogo";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCurrentVideoApi,
  markChapterAsCompleted,
} from "@/store/slices/courseSlice";
import { useAuth } from "@/hooks";
import useProgress from "@/hooks/useProgress";
import type {
  FullCourseType,
  FullChapterType,
} from "@/app/types/types";

interface ModernCoursePageProps {
  course: FullCourseType;
  initialChapterId?: string;
}

export const CoursePage: React.FC<ModernCoursePageProps> = ({
  course,
  initialChapterId,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoEnding, setVideoEnding] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [resumePromptShown, setResumePromptShown] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  // Redux state
  const currentVideoId = useAppSelector(
    (state) => state.course.currentVideoId
  );
  const courseProgress = useAppSelector(
    (state) => state.course.courseProgress[course.id]
  );
  const bookmarks = useAppSelector(
    (state) => state.course.bookmarks[currentVideoId] || []
  );

  // Memoized video playlist
  const videoPlaylist = useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapterType }[] = [];
    course.courseUnits?.forEach((unit) => {
      unit.chapters
        .filter((chapter): chapter is FullChapterType =>
          Boolean(chapter.videoId)
        )
        .forEach((chapter) => {
          if (chapter.videoId) {
            playlist.push({ videoId: chapter.videoId, chapter });
          }
        });
    });
    return playlist;
  }, [course.courseUnits]);

  // Current chapter and navigation
  const currentChapter = useMemo(() => {
    if (!currentVideoId) return undefined;
    return videoPlaylist.find(
      (entry) => entry.videoId === currentVideoId
    )?.chapter;
  }, [currentVideoId, videoPlaylist]);

  const currentIndex = useMemo(() => {
    return videoPlaylist.findIndex(
      (entry) => entry.videoId === currentVideoId
    );
  }, [currentVideoId, videoPlaylist]);

  const nextChapter = useMemo(() => {
    return currentIndex < videoPlaylist.length - 1
      ? videoPlaylist[currentIndex + 1]
      : null;
  }, [currentIndex, videoPlaylist]);

  const prevChapter = useMemo(() => {
    return currentIndex > 0 ? videoPlaylist[currentIndex - 1] : null;
  }, [currentIndex, videoPlaylist]);

  const isLastVideo = useMemo(() => {
    return currentIndex === videoPlaylist.length - 1;
  }, [currentIndex, videoPlaylist]);

  // Progress tracking
  const { progress, updateProgress } = useProgress({
    courseId: Number(course.id),
    currentChapterId: currentChapter?.id?.toString(),
  });

  // Initialize video on mount
  useEffect(() => {
    const initialVideo = initialChapterId
      ? videoPlaylist.find(
          (entry) => entry.chapter.id.toString() === initialChapterId
        )
      : videoPlaylist[0];

    if (initialVideo && !currentVideoId) {
      dispatch(setCurrentVideoApi(initialVideo.videoId));
    }
  }, [dispatch, initialChapterId, videoPlaylist, currentVideoId]);

  // Resume prompt
  useEffect(() => {
    if (
      progress &&
      !resumePromptShown &&
      progress.currentChapterId &&
      !currentVideoId
    ) {
      const resumeChapter = videoPlaylist.find(
        (entry) =>
          entry.chapter.id.toString() ===
          progress.currentChapterId?.toString()
      );

      if (resumeChapter) {
        setResumePromptShown(true);
        toast({
          title: "Resume Learning",
          description: `Continue from "${resumeChapter.chapter.title}"?`,
          action: (
            <Button
              size="sm"
              onClick={() => {
                dispatch(setCurrentVideoApi(resumeChapter.videoId));
              }}
            >
              Resume
            </Button>
          ),
        });
      }
    }
  }, [
    progress,
    resumePromptShown,
    currentVideoId,
    videoPlaylist,
    dispatch,
    toast,
  ]);

  // Video event handlers
  const handleVideoEnd = useCallback(() => {
    if (currentChapter) {
      dispatch(
        markChapterAsCompleted({
          courseId: Number(course.id),
          chapterId: Number(currentChapter.id),
        })
      );

      updateProgress({
        currentChapterId: Number(currentChapter.id),
        completedChapters: [
          ...(progress?.completedChapters || []),
          Number(currentChapter.id),
        ],
        isCompleted: isLastVideo,
        lastAccessedAt: new Date(),
      });

      if (isLastVideo) {
        setShowCertificate(true);
      } else if (nextChapter) {
        setTimeout(() => {
          dispatch(setCurrentVideoApi(nextChapter.videoId));
        }, 3000);
      }
    }
  }, [
    currentChapter,
    dispatch,
    course.id,
    updateProgress,
    progress,
    isLastVideo,
    nextChapter,
  ]);

  const handleVideoProgress = useCallback(
    (progressState: { played: number; playedSeconds: number }) => {
      if (progressState.playedSeconds > 0 && currentChapter) {
        const timeRemaining =
          (currentChapter.duration || 300) - progressState.playedSeconds;
        if (
          timeRemaining <= 5 &&
          timeRemaining > 0 &&
          !videoEnding
        ) {
          setVideoEnding(true);
        }
      }

      if (currentChapter && progressState.played > 0.1) {
        updateProgress({
          currentChapterId: Number(currentChapter.id),
          progress: progressState.played,
          lastAccessedAt: new Date(),
        });
      }
    },
    [currentChapter, videoEnding, updateProgress]
  );

  const handleChapterSelect = useCallback(
    (videoId: string) => {
      dispatch(setCurrentVideoApi(videoId));
      setVideoEnding(false);
    },
    [dispatch]
  );

  const handleNextVideo = useCallback(() => {
    if (nextChapter) {
      dispatch(setCurrentVideoApi(nextChapter.videoId));
      setVideoEnding(false);
    }
  }, [nextChapter, dispatch]);

  const handlePrevVideo = useCallback(() => {
    if (prevChapter) {
      dispatch(setCurrentVideoApi(prevChapter.videoId));
      setVideoEnding(false);
    }
  }, [prevChapter, dispatch]);

  const handleCertificateClick = useCallback(() => {
    setShowCertificate(true);
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => !prev);
  }, []);

  const courseStats = useMemo(() => {
    const totalChapters = videoPlaylist.length;
    const completedChapters = progress?.completedChapters?.length || 0;
    const progressPercentage =
      totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;

    return {
      totalChapters,
      completedChapters,
      progressPercentage,
    };
  }, [videoPlaylist.length, progress?.completedChapters]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {!theaterMode && (
        <div className="lg:hidden border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 mx-4">
              <h1 className="font-semibold text-lg line-clamp-1">
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {courseStats.progressPercentage}% Complete
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {courseStats.completedChapters}/
                  {courseStats.totalChapters} chapters
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheaterMode}
            >
              {theaterMode ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <main
          className={cn(
            "flex-1 flex flex-col min-w-0",
            !theaterMode && sidebarOpen ? "lg:mr-96" : "",
            theaterMode ? "h-full" : ""
          )}
        >
          <div className="flex-1 relative bg-black flex flex-col">
            {currentVideoId ? (
              <>
                <div className="flex-1">
                  <VideoPlayer
                    videoId={currentVideoId}
                    onEnded={handleVideoEnd}
                    onProgress={handleVideoProgress}
                    autoPlay={false}
                    isAuthenticated={!!session}
                    onChapterComplete={() => {}}
                    onNextVideo={handleNextVideo}
                    nextVideoTitle={nextChapter?.chapter.title}
                    courseName={course.title}
                    bookmarks={bookmarks}
                    onBookmark={(time, title) => {}}
                    playerConfig={{
                      showCertificateButton:
                        isLastVideo &&
                        courseStats.progressPercentage === 100,
                    }}
                    onCertificateClick={handleCertificateClick}
                    height="100%"
                    width="100%"
                    onToggleTheaterMode={toggleTheaterMode}
                    isTheaterMode={theaterMode}
                  />
                </div>
                <AnimatedCourseAILogo
                  show={true}
                  videoEnding={videoEnding}
                  onAnimationComplete={() => setVideoEnding(false)}
                />
                {theaterMode && (
                  <div className="absolute top-4 right-4 z-50">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={toggleTheaterMode}
                      className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">
                    Select a Chapter
                  </h3>
                  <p className="text-white/70">
                    Choose a chapter from the playlist to start learning
                  </p>
                </div>
              </div>
            )}
          </div>

          {!theaterMode && (
            <div className="flex-1 bg-background overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b bg-background">
                <Button
                  variant="outline"
                  onClick={handlePrevVideo}
                  disabled={!prevChapter}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="text-center flex-1 mx-4">
                  {currentChapter && (
                    <div>
                      <h2 className="text-lg font-semibold mb-1 line-clamp-1">
                        {currentChapter.title}
                      </h2>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {currentChapter.duration || "5 min"}
                        </span>
                        {currentChapter.isFree && (
                          <Badge variant="secondary">Free</Badge>
                        )}
                        <span>•</span>
                        <span>
                          Chapter {currentIndex + 1} of{" "}
                          {videoPlaylist.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextVideo}
                  disabled={!nextChapter}
                  className="flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden">
                {currentChapter && (
                  <CourseDetailsTabs
                    course={course}
                    currentChapter={currentChapter}
                    isAuthenticated={!!session}
                    isPremium={user?.planId === "premium"}
                    isAdmin={user?.role === "admin"}
                  />
                )}
              </div>
            </div>
          )}
        </main>

        {!theaterMode && (
          <aside
            className={cn(
              "hidden lg:block w-96 border-l bg-background transition-all duration-300",
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Course Content</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <VideoNavigationSidebar
                  course={course}
                  currentChapter={currentChapter}
                  courseId={course.id.toString()}
                  onVideoSelect={handleChapterSelect}
                  currentVideoId={currentVideoId || ""}
                  isAuthenticated={!!session}
                  progress={progress}
                  completedChapters={progress?.completedChapters || []}
                  nextVideoId={nextChapter?.videoId}
                  prevVideoId={prevChapter?.videoId}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      <AnimatePresence>
        {showCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold">Course Certificate</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCertificate(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <CertificateGenerator
                  course={course}
                  user={user}
                  completionDate={new Date()}
                  onClose={() => setShowCertificate(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePage;
