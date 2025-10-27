import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Inline mobile playlist to avoid dependency on deleted VideoNavigationSidebar

interface MobilePlaylistOverlayProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const MobilePlaylistOverlay: React.FC<MobilePlaylistOverlayProps> = ({
  isOpen,
  onClose,
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
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="xl:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeInOut", type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Redesigned Header with better alignment and enhanced colors */}
            <div className="p-6 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">Course Content</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {courseStats.completedCount} of {courseStats.totalChapters} completed
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-full w-10 h-10 p-0 border border-transparent hover:border-primary/20"
                >
                  ×
                </Button>
              </div>

              {/* Progress Bar with better alignment and colors */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Progress</span>
                  <span className="text-sm font-semibold text-primary">{Math.round(courseStats.progressPercentage)}%</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-3 border border-primary/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${courseStats.progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-primary via-primary/80 to-secondary h-3 rounded-full neo-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Chapter List with better alignment */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {course.chapters.map((ch, index) => {
                  const isActive = String(currentChapter?.id) === String(ch.id)
                  const isCompleted = completedChapters.includes(String(ch.id))
                  const duration = videoDurations[ch.videoId || ''] || ch.duration || 0
                  const hasVideo = !!ch.videoId

                  return (
                    <motion.button
                      key={ch.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onChapterSelect(ch)
                        onClose()
                      }}
                      className={cn(
                        "w-full text-left p-5 rounded-xl flex items-center justify-between transition-all duration-300 group",
                        "border border-transparent hover:border-primary/30 hover:shadow-lg",
                        isActive
                          ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/10 border-primary/30 shadow-lg shadow-primary/10'
                          : 'bg-card/50 hover:bg-card/80',
                        !hasVideo && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Enhanced Status Icon with better alignment and colors */}
                        <div className={cn(
                          "w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold transition-all duration-200 border",
                          isActive
                            ? "bg-gradient-to-r from-primary to-secondary text-white border-primary/50 shadow-lg"
                            : isCompleted
                            ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-gradient-to-r from-muted to-muted/80 text-muted-foreground border-muted/50 group-hover:from-primary/10 group-hover:to-secondary/10 group-hover:border-primary/20"
                        )}>
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            >
                              ✓
                            </motion.div>
                          ) : isActive ? (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              ▶
                            </motion.div>
                          ) : (
                            <span className="text-lg">{index + 1}</span>
                          )}
                        </div>

                        {/* Chapter Info with better alignment and colors */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-medium truncate transition-colors duration-200",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {ch.title}
                          </div>
                          {duration > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <span>⏱️</span>
                              {formatDuration(duration)}
                            </div>
                          )}
                          {!hasVideo && (
                            <div className="text-xs text-muted-foreground mt-1">
                              No video available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Active Indicator with better alignment and colors */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-primary font-semibold text-sm bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1 rounded-full border border-primary/20"
                        >
                          Now Playing
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(MobilePlaylistOverlay);
