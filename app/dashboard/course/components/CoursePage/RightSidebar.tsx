import React, { useCallback, useMemo } from "react";
import { signIn, useSession } from "next-auth/react";
import { Lock, User, Info } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ChapterList from "./ChapterList";
import EnrollCard from "./EnrollCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FullCourseType, FullChapterType } from "@/app/types";
import { CourseProgress } from "@prisma/client";

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
        {!isSubscribed && <EnrollmentCard />}
        
        {progress && <ProgressCard progress={progress} totalChapters={totalChapters} />}

        <AnimatePresence>
          {(!isOwner && !isSubscribed) ? (
            <LockedContentOverlay />
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
    <Card className="mb-6">
      <CardContent>
        <EnrollCard />
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  progress: CourseProgress;
  totalChapters: number;
}

function ProgressCard({ progress, totalChapters }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
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
        <Progress value={progress.progress} className="w-full h-2 bg-gray-200" />
        <p className="text-sm text-muted-foreground mt-2 flex justify-between items-center">
          <span>{progress.completedChapters.length} / {totalChapters} chapters completed</span>
          <span className="font-semibold">{Math.round(progress.progress)}%</span>
        </p>
      </CardContent>
    </Card>
  );
}

function LockedContentOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-2xl">
            <Lock className="mr-2" />
            Content Locked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            Sign in to access the full course content and track your progress.
          </p>
          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
          >
            <User className="mr-2 h-4 w-4" /> Sign In
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default React.memo(RightSidebar);
