import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
}

const MobilePlaylistOverlay: React.FC<MobilePlaylistOverlayProps> = ({
  isOpen,
  onClose,
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
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Course Content</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {course.chapters.map((ch) => {
                  const isActive = String(currentChapter?.id) === String(ch.id)
                  const isCompleted = completedChapters.includes(String(ch.id))
                  const duration = videoDurations[ch.videoId || ''] || ch.duration || 0
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onChapterSelect(ch)
                        onClose()
                      }}
                      className={"w-full text-left p-3 rounded-md flex items-center justify-between " + (isActive ? 'bg-primary/10 border border-primary/20' : 'bg-card')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={"w-10 h-10 rounded-sm overflow-hidden bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground"}>
                          {isCompleted ? '✓' : ''}
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium truncate">{ch.title}</div>
                          <div className="text-xs text-muted-foreground">{formatDuration(duration)}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{isActive ? 'Playing' : ''}</div>
                    </button>
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
