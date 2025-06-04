"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import EnhancedVideoPlayer from "./EnhancedVideoPlayer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PlayCircle, Clock, Video, BookOpen } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import CourseDetailsQuiz from "./CourseDetailsQuiz"
import CourseAISummary from "./CourseAISummary"
import CourseCompletionOverlay from "./CourseCompletionOverlay"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setCurrentVideoApi,
  markChapterAsCompleted,
  setCourseCompletionStatus,
  setAutoplayEnabled,
} from "@/store/slices/courseSlice"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { PauseCircle } from "lucide-react"
import CertificateGenerator from "./CertificateGenerator"
import { Award } from "lucide-react"

interface MainContentProps {
  slug: string;
  initialVideoId?: string;
  nextVideoId?: string;
  prevVideoId?: string;
  onVideoEnd: () => void;
  onVideoSelect: (videoId: string) => void;
  currentChapter?: FullChapterType;
  currentTime?: number;
  onWatchAnotherCourse: () => void;
  onTimeUpdate?: (time: number) => void;
  planId?: string;
  isLastVideo?: boolean;
  autoPlay?: boolean;
  progress?: CourseProgress;
  onChapterComplete?: () => void;
  courseCompleted?: boolean;
  course: FullCourseType;
  relatedCourses?: Array<{ id: string | number; title: string; slug: string; category?: { name: string }; image?: string }>;

}

function MainContent({
  slug,
  initialVideoId,
  nextVideoId,
  prevVideoId,
  onVideoEnd,
  onVideoSelect,
  currentChapter,
  currentTime = 0,
  onWatchAnotherCourse,
  onTimeUpdate,
  planId = "FREE",
  isLastVideo = false,
  autoPlay = false,
  progress,
  onChapterComplete,
  courseCompleted = false,
  course,
  relatedCourses = [],
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState("notes");
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [autoplayOverlay, setAutoplayOverlay] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(5);
  const dispatch = useAppDispatch();
  const currentVideoId = useAppSelector((state) => state.course.currentVideoId);
  const autoplayEnabled = useAppSelector((state) => state.course.autoplayEnabled);
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAuthenticated = !!session;
  const bookmarks = useAppSelector((state) => state.course.bookmarks[currentVideoId || ''] || []);
  const didSetInitialVideo = useRef(false);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, []);

  // 1. Define handleNextVideo first
  const handleNextVideo = useCallback(() => {
    if (nextVideoId) {
      dispatch(setCurrentVideoApi(nextVideoId));
      onVideoSelect(nextVideoId);
      toast({ title: "Next Video", description: "Playing the next video." });
    } else if (isLastVideo) {
      dispatch(setCourseCompletionStatus(true));
    }
  }, [nextVideoId, isLastVideo, dispatch, onVideoSelect, toast]);



  // Set initial video only once on mount or when dependencies change
  useEffect(() => {
    if (
      !didSetInitialVideo.current &&
      !currentVideoId &&
      (initialVideoId || (course?.courseUnits && course.courseUnits.length > 0))
    ) {
      if (initialVideoId) {
        dispatch(setCurrentVideoApi(initialVideoId));
      } else {
        const firstVideoId = course?.courseUnits?.flatMap((unit) =>
          unit.chapters).find((chapter) => !!chapter.videoId)?.videoId;

        if (firstVideoId) {
          dispatch(setCurrentVideoApi(firstVideoId));
        }
      }
      didSetInitialVideo.current = true;
    }
  }, [currentVideoId, initialVideoId, dispatch, course.courseUnits]);

  // Debug: log autoplay state
  useEffect(() => {
    console.debug("[MainContent] autoplayEnabled:", autoplayEnabled);
  }, [autoplayEnabled]);

  // 3. Cancel autoplay overlay
  const handleCancelAutoplay = useCallback(() => {
    setAutoplayOverlay(false);
    setAutoplayCountdown(5);
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
  }, [])

  // Handle playlist video selection
  const handlePlaylistVideoSelect = useCallback(
    (videoId: string) => {
      console.debug("[MainContent] Playlist video selected:", videoId);
      dispatch(setCurrentVideoApi(videoId));
      dispatch(setAutoplayEnabled(true));
      if (typeof onVideoSelect === "function") {
        onVideoSelect(videoId);
      }
    },
    [dispatch, onVideoSelect]
  )
  // 2. Then define handleVideoEnd which uses handleNextVideo
  const handleVideoEnd = useCallback(() => {
    if (nextVideoId && autoplayEnabled) {
      setAutoplayOverlay(true);
      setAutoplayCountdown(5);
      
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }

      let count = 5;
      const tick = () => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            handleNextVideo();
            setAutoplayOverlay(false);
            return 5;
          }
          return prev - 1;
        });
        count--;
        if (count > 0) {
          autoplayTimeoutRef.current = setTimeout(tick, 1000);
        }
      };
      
      autoplayTimeoutRef.current = setTimeout(tick, 1000);
    } else if (isLastVideo) {
      setShowCompletionOverlay(true);
    }
    
    onVideoEnd();
  }, [nextVideoId, autoplayEnabled, isLastVideo, onVideoEnd, handleNextVideo]);
  const renderTabContent = () => {
    switch (activeTab) {
      case "notes":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6 mb-6" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            }
          >
            <CourseAISummary
              chapterId={currentChapter?.id?.toString() || ""}
              name={currentChapter?.title || ""}
              existingSummary={currentChapter?.summary || ""}
              isPremium={planId === "PRO" || planId === "ULTIMATE"}
              isAdmin={session?.user?.isAdmin ?? false}
            />
          </Suspense>
        ) : (
          <div className="text-center text-muted-foreground">Upgrade to access AI summaries.</div>
        )
      case "quiz":
        return planId === "PRO" || planId === "ULTIMATE" ? (
          <Suspense
            fallback={
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full" />
              </div>
            }
          >
            <CourseDetailsQuiz
              isPremium={planId === "PRO" || planId === "ULTIMATE"}
              isPublicCourse={course?.isPublic || false}
              chapter={currentChapter || {}}
              course={course || {}}
            />
          </Suspense>
        ) : (
          <div className="text-center text-muted-foreground">Upgrade to access quizzes.</div>
        )
      default:
        return (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        )
    }
  }

  // Autoplay toggle UI (ShadCN Switch + Button)
  const AutoplayToggle = (
    <div className="flex items-center gap-3">
      <Switch
        checked={autoplayEnabled}
        onCheckedChange={(checked) => dispatch(setAutoplayEnabled(checked))}
        id="autoplay-switch"
      />
      <label htmlFor="autoplay-switch" className="flex items-center gap-2 cursor-pointer select-none text-sm">
        {autoplayEnabled ? (
          <PlayCircle className="h-5 w-5 text-primary" />
        ) : (
          <PauseCircle className="h-5 w-5 text-muted-foreground" />
        )}
        Autoplay {autoplayEnabled ? "On" : "Off"}
      </label>
    </div>
  )

  // Related Courses Section (ShadCN Card grid)
  const RelatedCoursesSection = relatedCourses && relatedCourses.length > 0 ? (
    <div className="mt-8">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Related Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedCourses.map((course) => (
              <a
                key={course.id}
                href={`/dashboard/course/${course.slug}`}
                className="block group"
                tabIndex={0}
                aria-label={`Go to course ${course.title}`}
              >
                <Card className="transition-all hover:shadow-lg hover:border-primary/60 group-hover:scale-105">
                  <CardContent className="p-4">
                    <div className="font-medium mb-1 truncate">{course.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.category?.name || "Uncategorized"}
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null

  // Show course completion overlay/modal when last video ends
  const showCourseComplete =
    isLastVideo && showCompletionOverlay && courseCompleted;

  return (
    <div className="space-y-6">
      {/* Autoplay Overlay */}
      <AnimatePresence>
        {autoplayOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <Card className="w-full max-w-sm mx-auto shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Next video starting in {autoplayCountdown}...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={((5 - autoplayCountdown) / 5) * 100} className="mb-4" />
                <Button
                  variant="destructive"
                  onClick={handleCancelAutoplay}
                  className="w-full"
                  aria-label="Cancel autoplay"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player */}
      <div className="relative rounded-lg overflow-hidden border border-border shadow-md">
        {currentVideoId ? (
          <EnhancedVideoPlayer
            videoId={currentVideoId}
            onEnded={handleVideoEnd}
            autoPlay={autoPlay || autoplayEnabled}
            onProgress={onTimeUpdate}
            initialTime={currentTime}
            isLastVideo={isLastVideo}
            onVideoSelect={handlePlaylistVideoSelect}
            courseName={course?.title || ""}
            nextVideoId={nextVideoId}
            bookmarks={bookmarks}
            isAuthenticated={isAuthenticated}
            onChapterComplete={onChapterComplete || (() => currentChapter && dispatch(markChapterAsCompleted(currentChapter.id)))}
            playerConfig={{
              showRelatedVideos: false,
              rememberPosition: true,
              rememberMute: true,
              showCertificateButton: isLastVideo,
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full aspect-video bg-background rounded-lg">
            <Loader2 className="h-10 w-10 mb-4 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        )}
      </div>

      {/* Autoplay Toggle */}
      <div className="flex items-center justify-between mt-4">
        {AutoplayToggle}
      </div>

      {/* Tabs for Notes and Quiz */}
      <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 bg-background border border-border/30 rounded-lg p-1">
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
          >
            AI Summary
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
          >
            Quiz
          </TabsTrigger>
        </TabsList>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent
              value="notes"
              className="space-y-4 bg-background rounded-lg p-4 border border-border/30 shadow-sm"
            >
              {renderTabContent()}
            </TabsContent>
            <TabsContent value="quiz" className="bg-background rounded-lg p-4 border border-border/30 shadow-sm">
              {renderTabContent()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Course Completion Overlay/Modal */}
      <AnimatePresence>
        {showCourseComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-lg mx-auto shadow-2xl relative">
              <CardHeader className="flex flex-col items-center">
                <Award className="h-16 w-16 text-primary mb-4 animate-bounce" />
                <CardTitle className="text-3xl font-bold text-center mb-2">Course Completed!</CardTitle>
                <div className="text-muted-foreground text-center mb-2">
                  Congratulations on finishing <span className="font-semibold text-foreground">{course?.title}</span>!
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <CertificateGenerator courseName={course?.title || "Course"} />
                </div>
                {RelatedCoursesSection}
                <Button
                  variant="secondary"
                  className="w-full mt-6"
                  onClick={() => {
                    setShowCompletionOverlay(false)
                    onWatchAnotherCourse()
                  }}
                >
                  Explore More Courses
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Courses Section (for non-final video view) */}
      {!showCourseComplete && RelatedCoursesSection}

      {showCompletionOverlay && (
        <CourseCompletionOverlay
          courseName={course?.title || ""}
          onClose={() => setShowCompletionOverlay(false)}
          onWatchAnotherCourse={onWatchAnotherCourse}
          fetchRelatedCourses={async () => relatedCourses}
        />
      )}
    </div>
  )
}

// Use React.memo for performance optimization
const MemoizedMainContent = React.memo(MainContent);
export default MemoizedMainContent;
