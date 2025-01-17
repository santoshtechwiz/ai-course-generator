import React, { useCallback, useMemo } from "react";
import { signIn, useSession } from "next-auth/react";
import { Lock, User, Info, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ChapterList from "./ChapterList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FullCourseType, FullChapterType } from "@/app/types";
import { CourseProgress } from "@prisma/client";
import router from "next/router";

interface RightSidebarProps {
  course: FullCourseType;
  currentChapter?: FullChapterType;
  courseId: string;
  onVideoSelect: (videoId: string) => void;
  currentVideoId: string;
  isAuthenticated: boolean;
  courseOwnerId: string;
  isSubscribed: boolean;
  progress: CourseProgress | null;
}

interface ProgressCardProps {
  progress: CourseProgress;
  totalChapters: number;
}

function RightSidebar({
  course,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  courseOwnerId,
  isSubscribed,
  progress,
}: RightSidebarProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === courseOwnerId;

  const handleVideoSelect = useCallback(
    (videoId: string) => {
      if (videoId !== currentVideoId) {
        onVideoSelect(videoId);
      }
    },
    [currentVideoId, onVideoSelect]
  );

  const totalChapters = useMemo(() => {
    return course.courseUnits.reduce(
      (sum, unit) => sum + unit.chapters.length,
      0
    );
  }, [course.courseUnits]);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="h-full space-y-6 relative w-full lg:w-[350px] lg:max-w-md mx-auto p-4"
      >
        {isAuthenticated && !isSubscribed && <EnrollmentCard />}

        {progress && <ProgressCard progress={progress} totalChapters={totalChapters} />}

        <AnimatePresence>
          {(!isOwner && !isSubscribed) ? (
            <LockedContentOverlay isAuthenticated={isAuthenticated} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 relative"
            >
              <ChapterList
                course={course}
                onVideoSelect={handleVideoSelect}
                currentVideoId={currentVideoId}
                isAuthenticated={isAuthenticated}
                completedChapters={Array.isArray(progress?.completedChapters) ? progress.completedChapters : []}
                currentChapter={currentChapter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}

function EnrollmentCard() {
  return (
    <Card className="mb-6 border-2 border-primary">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">Unlock Premium Features</h3>
        <ul className="list-disc list-inside mb-6 text-sm space-y-2">
          <li>Create your own quizzes</li>
          <li>Access exclusive playlists</li>
          <li>Customize your learning experience</li>
          <li>Track your progress across all courses</li>
        </ul>
        <Button 
          onClick={() => router.push('/dashboard/subscription')}
          className="w-full text-lg py-6 relative overflow-hidden group"
        >
          <span className="relative z-10">Subscribe Now</span>
          <motion.div
            className="absolute inset-0 bg-primary-foreground opacity-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 1], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
          <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProgressCard({ progress, totalChapters }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          Course Progress
          <Tooltip>
            <TooltipTrigger>
              <Info size={18} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Track your progress through the course</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progress.progress} className="w-full h-3 bg-gray-200" />
        <p className="text-sm text-muted-foreground mt-4 flex justify-between items-center">
          <span>{progress.completedChapters.length} / {totalChapters} chapters completed</span>
          <span className="text-lg font-semibold">{Math.round(progress.progress)}%</span>
        </p>
      </CardContent>
    </Card>
  );
}

function LockedContentOverlay({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <Card className="w-full max-w-sm mx-4 border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-2xl">
            <Lock className="mr-2" />
            {isAuthenticated ? "Premium Content" : "Sign In Required"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-6 text-lg">
            {isAuthenticated 
              ? "Subscribe to access the full course content and track your progress."
              : "Sign in to explore all playlists and quizzes."}
          </p>
          <Button
            className="w-full bg-primary text-primary-foreground text-lg py-6 relative overflow-hidden group"
            onClick={() => isAuthenticated 
              ? router.push('/dashboard/subscription')
              : signIn(undefined, { callbackUrl: window.location.href })
            }
          >
            <span className="relative z-10">
              {isAuthenticated ? "Subscribe Now" : "Sign In"}
            </span>
            <motion.div
              className="absolute inset-0 bg-primary-foreground opacity-20"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RightSidebar;

