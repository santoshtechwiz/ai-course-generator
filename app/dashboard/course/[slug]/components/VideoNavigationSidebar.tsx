import React, { useMemo } from "react"
import { CheckCircle, Clock, Play, Lock, Video, VideoOff } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"


interface Chapter {
  id: string;
  title: string;
  videoId?: string; // Make videoId optional to match real-world data
  duration?: number;
}

interface Course {
  id: number | string;
  title: string;
  chapters: Chapter[];
}

interface VideoNavigationSidebarProps {
  course: Course;
  currentChapter: Chapter | null;
  courseId: string;
  onChapterSelect: (chapter: Chapter) => void;
  currentVideoId: string;
  isAuthenticated: boolean;
  progress: Record<string, number>;
  completedChapters: string[];
  nextVideoId?: string;
  prevVideoId?: string;
  videoDurations: Record<string, number>;
  formatDuration: (duration: number) => string;
  courseStats: Record<string, any>;
}

const VideoNavigationSidebar: React.FC<VideoNavigationSidebarProps> = ({
  course,
  currentChapter,
  courseId,
  onChapterSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  completedChapters,
  videoDurations,
  formatDuration,
}) => {
  // Calculate overall course progress
  const overallProgress = useMemo(() => {
    if (!course?.chapters?.length || !completedChapters?.length) return 0;
    return (completedChapters.length / course.chapters.length) * 100;
  }, [course, completedChapters]);

  // Group chapters by module if they follow a pattern like "Module X: Title"
  const groupedChapters = useMemo(() => {
    if (!course?.chapters?.length) return [];

    const moduleRegex = /^(Module\s+\d+):\s*(.+)$/i;
    const modules: Record<string, { title: string; chapters: Chapter[] }> = {};
    
    // First pass - identify modules
    course.chapters.forEach(chapter => {
      const match = chapter.title.match(moduleRegex);
      if (match) {
        const [, moduleKey, chapterTitle] = match;
        if (!modules[moduleKey]) {
          modules[moduleKey] = { title: moduleKey, chapters: [] };
        }
      }
    });
    
    // If no modules found, return chapters as is
    if (Object.keys(modules).length === 0) {
      return [{ title: "Course Content", chapters: course.chapters }];
    }
    
    // Second pass - group chapters
    course.chapters.forEach(chapter => {
      const match = chapter.title.match(moduleRegex);
      if (match) {
        const [, moduleKey, chapterTitle] = match;
        modules[moduleKey].chapters.push({
          ...chapter,
          // Optionally clean the title to remove module prefix
          title: chapterTitle.trim()
        });
      } else {
        // Handle chapters without module prefix
        if (!modules["Other"]) {
          modules["Other"] = { title: "Other Content", chapters: [] };
        }
        modules["Other"].chapters.push(chapter);
      }
    });
    
    return Object.values(modules);
  }, [course]);

  // Validate that we have chapters
  if (!course?.chapters?.length) {
    return <div className="p-4 text-center text-muted-foreground">No chapters available</div>;
  }

  // Create a safe handler for chapter selection that validates the chapter first
  const handleChapterClick = (chapter: Chapter | any, index: number) => {
    // Don't proceed if the chapter doesn't have a videoId
    if (!chapter.videoId) {
      console.info("Chapter doesn't have a videoId:", chapter);
      return;
    }
    
   
    // Valid chapter, pass to parent handler
    onChapterSelect(chapter);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Course Progress Header */}
      <div className="bg-muted/30 p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Course Progress</h3>
          <Badge variant="outline">
            {Math.round(overallProgress)}%
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* If we have grouped chapters, render by module */}
          {groupedChapters.map((module, moduleIndex) => (
            <div key={moduleIndex} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-sm mb-3 text-primary">
                {module.title}
              </h3>
              <ul className="space-y-1">
                {module.chapters.map((chapter, chapterIndex) => {
                  // Create a default chapter with required fields to avoid missing ID
                  const safeChapter = {
                    id: String(chapter.id || `chapter-${moduleIndex}-${chapterIndex}`),
                    title: chapter.title || 'Untitled Chapter',
                    videoId: chapter.videoId,
                    duration: chapter.duration
                  };

                  const isActive = currentChapter && safeChapter.id === String(currentChapter.id);
                  const isCompleted = completedChapters?.includes(Number(safeChapter.id)) ||
                                      completedChapters?.includes(safeChapter.id);
                  const chapterProgress = safeChapter.videoId ? (progress?.[safeChapter.videoId] || 0) : 0;
                  const duration = safeChapter.videoId ? videoDurations?.[safeChapter.videoId] : undefined;
                  const hasVideo = !!safeChapter.videoId;
                  
                  return (
                    <li key={safeChapter.id}>
                      <button
                        onClick={() => hasVideo ? handleChapterClick(chapter, chapterIndex) : null}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200",
                          "flex items-start gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isActive ? 
                            "bg-primary/10 text-primary font-medium" : 
                            "hover:bg-muted",
                          !hasVideo && "opacity-70 cursor-not-allowed"
                        )}
                        aria-current={isActive ? "true" : "false"}
                        disabled={!hasVideo}
                        title={!hasVideo ? "This chapter doesn't have a video" : undefined}
                        data-chapter-id={safeChapter.id}
                        data-has-video={hasVideo ? "true" : "false"}
                      >
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isActive ? (
                            <Play className="h-5 w-5 text-primary fill-primary" />
                          ) : !hasVideo ? (
                            <VideoOff className="h-5 w-5 text-muted-foreground/70" />
                          ) : !isAuthenticated ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2",
                              chapterProgress > 0 ? "border-primary" : "border-muted-foreground/30",
                            )}>
                              {chapterProgress > 0 && (
                                <div 
                                  className="bg-primary h-full rounded-full"
                                  style={{ width: `${chapterProgress}%` }}
                                ></div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "line-clamp-2",
                            isActive ? "text-primary font-medium" : 
                            isCompleted ? "text-foreground" : "text-muted-foreground",
                            !hasVideo && "italic"
                          )}>
                            {safeChapter.title}
                            {!hasVideo && " (No Video)"}
                          </p>
                          
                          {duration && hasVideo && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(duration)}
                            </div>
                          )}
                          
                          {/* Progress bar for this chapter */}
                          {chapterProgress > 0 && chapterProgress < 100 && hasVideo && (
                            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full"
                                style={{ width: `${chapterProgress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default React.memo(VideoNavigationSidebar);
