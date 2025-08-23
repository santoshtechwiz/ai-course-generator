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
    }[];
  };
  currentChapter: {
    id: string;
    title: string;
    videoId?: string;
    duration?: number;
  } | null;
  courseId: string;
  currentVideoId: string;
  isAuthenticated: boolean;
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
}

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  course,
  currentChapter,
  courseId,
  currentVideoId,
  isAuthenticated,
  completedChapters,
  formatDuration,
  videoDurations,
  courseStats,
  onChapterSelect,
  isPiPActive = false
}) => {
  // Handler for chapter selection that ensures proper formatting
  const handleChapterSelect = useMemo(() => (chapter: any) => {
    onChapterSelect({
      ...chapter,
      id: typeof chapter.id === 'string' ? Number(chapter.id) : chapter.id,
      videoId: typeof chapter.videoId === 'string' ? chapter.videoId : null,
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
      className="hidden md:block"
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
            completedChapters={completedChapters}
            formatDuration={formatDuration}
            nextVideoId={undefined}
            currentVideoId={currentVideoId}
            courseStats={courseStats}
            videoDurations={videoDurations}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(PlaylistSidebar);
