import React, { useMemo } from "react";
import { motion } from "framer-motion";
import VideoNavigationSidebar from "./VideoNavigationSidebar";

interface PlaylistSidebarProps {
  course: {
    id: string | number;
    title: string;
    chapters: {
      id: string;
      title: string;
      videoId?: string;
      duration?: number;
      isFree?: boolean;
    }[];
  };
  currentChapter: {
    id: string;
    title: string;
    videoId?: string;
    duration?: number;
    isFree?: boolean;
  } | null;
  courseId: string;
  currentVideoId: string;
  isAuthenticated: boolean;
  userSubscription: string | null;
  completedChapters: string[];
  formatDuration: (seconds: number) => string;
  videoDurations: Record<string, number>;
  courseStats: {
    completedCount: number;
    totalChapters: number;
    progressPercentage: number;
  };
  onChapterSelect: (chapter: any) => void;
  isPiPActive?: boolean;
  isProgressLoading?: boolean;
}

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  course,
  currentChapter,
  courseId,
  currentVideoId,
  isAuthenticated,
  userSubscription,
  completedChapters,
  formatDuration,
  videoDurations,
  courseStats,
  onChapterSelect,
  isPiPActive = false,
  isProgressLoading = false
}) => {
  // Handler for chapter selection that ensures proper formatting - optimized memoization
  const handleChapterSelect = useMemo(() => (chapter: any) => {
    onChapterSelect({
      ...chapter,
      id: String(chapter.id), // Always convert ID to string for consistency
      videoId: chapter.videoId || null,
      duration: typeof chapter.duration === 'number' ? chapter.duration : undefined,
    });
  }, [onChapterSelect]);

  if (isPiPActive) {
    return null; // Don't render sidebar in PiP mode
  }

  return (
    <motion.div 
      key="sidebar-right"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="sticky top-4">
        <div className="rounded-xl border bg-card/60 ai-glass dark:ai-glass-dark">
          <VideoNavigationSidebar
            course={course}
            currentChapter={currentChapter}
            courseId={courseId}
            onChapterSelect={handleChapterSelect}
            progress={{}}
            isAuthenticated={isAuthenticated}
            userSubscription={userSubscription}
            completedChapters={completedChapters}
            formatDuration={formatDuration}
            nextVideoId={undefined}
            currentVideoId={currentVideoId}
            courseStats={courseStats}
            videoDurations={videoDurations}
            isProgressLoading={isProgressLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(PlaylistSidebar, (prevProps, nextProps) => {
  // Optimize re-renders by only updating when key props change
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.currentChapter?.id === nextProps.currentChapter?.id &&
    prevProps.currentVideoId === nextProps.currentVideoId &&
    prevProps.userSubscription === nextProps.userSubscription &&
    prevProps.completedChapters.length === nextProps.completedChapters.length &&
    prevProps.courseStats.progressPercentage === nextProps.courseStats.progressPercentage &&
    prevProps.isProgressLoading === nextProps.isProgressLoading &&
    prevProps.isPiPActive === nextProps.isPiPActive
  )
});
