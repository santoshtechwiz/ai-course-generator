import React, { useMemo, useState, useCallback } from "react"
import { CheckCircle, Clock, Play, Lock, Video, VideoOff, ChevronDown, ChevronRight, Trophy, Target, BookOpen, Zap, Star } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Chapter {
  id: string;
  title: string;
  videoId?: string;
  duration?: number;
  thumbnail?: string;
  locked?: boolean;
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
  courseStats,
}) => {
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)

  // Calculate overall course progress with smooth animation
  const overallProgress = useMemo(() => {
    if (!course?.chapters?.length || !completedChapters?.length) return 0;
    return (completedChapters.length / course.chapters.length) * 100;
  }, [course, completedChapters]);

  // Calculate course statistics
  const courseStatistics = useMemo(() => {
    const totalChapters = course?.chapters?.length || 0;
    const completedCount = completedChapters?.length || 0;
    const totalDuration = course?.chapters?.reduce((acc, chapter) => {
      return acc + (chapter.videoId ? videoDurations?.[chapter.videoId] || 0 : 0);
    }, 0) || 0;
    
    const watchedDuration = course?.chapters?.reduce((acc, chapter) => {
      if (chapter.videoId && completedChapters?.includes(chapter.id)) {
        return acc + (videoDurations?.[chapter.videoId] || 0);
      }
      return acc;
    }, 0) || 0;

    return {
      totalChapters,
      completedCount,
      totalDuration,
      watchedDuration,
      remainingChapters: totalChapters - completedCount,
    };
  }, [course, completedChapters, videoDurations]);

  // Group chapters by module with enhanced logic
  const groupedChapters = useMemo(() => {
    if (!course?.chapters?.length) return [];

    const moduleRegex = /^(Module\s+\d+|Unit\s+\d+|Chapter\s+\d+|Section\s+\d+):\s*(.+)$/i;
    const modules: Record<string, { title: string; chapters: Chapter[]; moduleNumber?: number }> = {};
    
    // First pass - identify modules
    course.chapters.forEach(chapter => {
      const match = chapter.title.match(moduleRegex);
      if (match) {
        const [, moduleKey, chapterTitle] = match;
        if (!modules[moduleKey]) {
          const numberMatch = moduleKey.match(/\d+/);
          modules[moduleKey] = { 
            title: moduleKey, 
            chapters: [],
            moduleNumber: numberMatch ? parseInt(numberMatch[0]) : 0
          };
        }
      }
    });
    
    // If no modules found, return chapters as is
    if (Object.keys(modules).length === 0) {
      return [{ title: "Course Content", chapters: course.chapters, moduleNumber: 1 }];
    }
    
    // Second pass - group chapters
    course.chapters.forEach(chapter => {
      const match = chapter.title.match(moduleRegex);
      if (match) {
        const [, moduleKey, chapterTitle] = match;
        modules[moduleKey].chapters.push({
          ...chapter,
          title: chapterTitle.trim()
        });
      } else {
        if (!modules["Additional Content"]) {
          modules["Additional Content"] = { title: "Additional Content", chapters: [], moduleNumber: 999 };
        }
        modules["Additional Content"].chapters.push(chapter);
      }
    });
    
    return Object.values(modules).sort((a, b) => (a.moduleNumber || 0) - (b.moduleNumber || 0));
  }, [course]);

  const toggleModule = useCallback((moduleTitle: string) => {
    setCollapsedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleTitle)) {
        newSet.delete(moduleTitle);
      } else {
        newSet.add(moduleTitle);
      }
      return newSet;
    });
  }, []);

  const handleChapterClick = useCallback((chapter: Chapter, index: number) => {
    // Don't allow navigation if chapter is locked
    if (chapter.locked) return;
    
    if (!chapter.videoId) {
      console.info("Chapter doesn't have a videoId:", chapter);
      return;
    }
    onChapterSelect(chapter);
  }, [onChapterSelect]);

  // Validate that we have chapters
  if (!course?.chapters?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium text-lg mb-2">No Content Available</h3>
            <p className="text-muted-foreground text-sm">
              This course doesn't have any chapters yet. Check back later for updates.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
        {/* Enhanced Course Progress Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 border-b border-border/50"
        >
          <div className="space-y-4">
            {/* Course Title */}
            <div>
              <h2 className="font-bold text-lg text-foreground line-clamp-2 mb-1">
                {course.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {courseStatistics.totalChapters} chapters • {formatDuration(courseStatistics.totalDuration)}
              </p>
            </div>

            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Progress</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {Math.round(overallProgress)}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={overallProgress} 
                  className="h-3 bg-muted/50"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{courseStatistics.completedCount} completed</span>
                  <span>{courseStatistics.remainingChapters} remaining</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-background/50 border-border/50 hover:bg-background/80 transition-colors cursor-help">
                    <CardContent className="p-3 text-center">
                      <Target className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{courseStatistics.completedCount}</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>Completed chapters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-background/50 border-border/50 hover:bg-background/80 transition-colors cursor-help">
                    <CardContent className="p-3 text-center">
                      <Clock className="h-4 w-4 text-green-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">
                        {formatDuration(courseStatistics.watchedDuration).split(' ')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">Watched</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>Time watched</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-background/50 border-border/50 hover:bg-background/80 transition-colors cursor-help">
                    <CardContent className="p-3 text-center">
                      <Zap className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{courseStatistics.remainingChapters}</div>
                      <div className="text-xs text-muted-foreground">Left</div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>Chapters remaining</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </motion.div>

        {/* Chapter List */}
        <ScrollArea className="flex-1">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4"
          >
            {groupedChapters.map((module, moduleIndex) => {
              const isCollapsed = collapsedModules.has(module.title);
              const moduleProgress = module.chapters.length > 0 
                ? (module.chapters.filter(ch => completedChapters?.includes(ch.id)).length / module.chapters.length) * 100 
                : 0;

              return (
                <motion.div 
                  key={moduleIndex} 
                  variants={itemVariants}
                  className="mb-8 last:mb-0"
                >
                  {/* Module Header */}
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleModule(module.title)}
                      className="w-full justify-between p-4 h-auto hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: isCollapsed ? 0 : 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                        <div className="text-left">
                          <h3 className="font-semibold text-sm text-primary group-hover:text-primary/80">
                            {module.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {module.chapters.length} chapters • {Math.round(moduleProgress)}% complete
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {module.chapters.filter(ch => completedChapters?.includes(ch.id)).length}/{module.chapters.length}
                      </Badge>
                    </Button>
                    
                    {/* Module Progress Bar */}
                    <div className="mt-2 mx-3">
                      <Progress value={moduleProgress} className="h-1" />
                    </div>
                  </div>

                  {/* Chapter List */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 ml-4"
                      >
                        {module.chapters.map((chapter, chapterIndex) => {
                          const safeChapter = {
                            id: String(chapter.id || `chapter-${moduleIndex}-${chapterIndex}`),
                            title: chapter.title || 'Untitled Chapter',
                            videoId: chapter.videoId,
                            duration: chapter.duration,
                            thumbnail: chapter.thumbnail || (chapter.videoId ? `https://img.youtube.com/vi/${chapter.videoId}/mqdefault.jpg` : undefined),
                            locked: chapter.locked
                          };

                          const isActive = currentChapter && safeChapter.id === String(currentChapter.id);
                          const isCompleted = completedChapters?.includes(String(safeChapter.id)) ||
                                              completedChapters?.includes(safeChapter.id);
                          const chapterProgress = safeChapter.videoId ? (progress?.[safeChapter.videoId] || 0) : 0;
                          const duration = safeChapter.videoId ? videoDurations?.[safeChapter.videoId] : undefined;
                          const hasVideo = !!safeChapter.videoId;
                          const isHovered = hoveredChapter === safeChapter.id;
                          const isLocked = safeChapter.locked || (!isAuthenticated && hasVideo);
                          
                          return (
                            <motion.li 
                              key={safeChapter.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: chapterIndex * 0.05 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => !isLocked && hasVideo ? handleChapterClick(chapter, chapterIndex) : null}
                                    onMouseEnter={() => setHoveredChapter(safeChapter.id)}
                                    onMouseLeave={() => setHoveredChapter(null)}
                                    className={cn(
                                      "w-full text-left px-4 py-4 rounded-lg text-sm transition-all duration-300",
                                      "flex items-start gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                      "border border-transparent hover:border-border/50",
                                      isActive ? 
                                        "bg-primary/10 text-primary font-medium border-primary/20 shadow-sm" : 
                                        "hover:bg-muted/50",
                                      !hasVideo && "opacity-70 cursor-not-allowed",
                                      isLocked && "opacity-60 cursor-not-allowed",
                                      isCompleted && !isActive && "bg-green-50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/50"
                                    )}
                                    aria-current={isActive ? "true" : "false"}
                                    disabled={!hasVideo || isLocked}
                                    data-chapter-id={safeChapter.id}
                                    data-has-video={hasVideo ? "true" : "false"}
                                  >
                                    {/* Enhanced Thumbnail or Status Icon */}
                                    <div className="flex-shrink-0 relative">
                                      {safeChapter.thumbnail && hasVideo ? (
                                        <div className="w-28 h-16 rounded-lg overflow-hidden border border-border/50 relative group">
                                          <img 
                                            src={safeChapter.thumbnail} 
                                            alt={safeChapter.title}
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                              // Fallback to default thumbnail on error
                                              const target = e.target as HTMLImageElement;
                                              target.src = `https://img.youtube.com/vi/${safeChapter.videoId}/default.jpg`;
                                            }}
                                          />
                                          {/* Duration overlay */}
                                          {duration && (
                                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                                              {formatDuration(duration)}
                                            </div>
                                          )}
                                          {/* Play overlay on hover */}
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-200">
                                            <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                          </div>
                                          {/* Lock overlay for locked content */}
                                          {isLocked && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                              <Lock className="h-4 w-4 text-white" />
                                            </div>
                                          )}
                                          {/* Progress bar */}
                                          {chapterProgress > 0 && !isCompleted && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                                              <div 
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${chapterProgress}%` }}
                                              />
                                            </div>
                                          )}
                                          {/* Completion badge */}
                                          {isCompleted && (
                                            <div className="absolute top-1 left-1">
                                              <CheckCircle className="h-4 w-4 text-green-500 bg-white rounded-full" />
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="w-7 h-7 mt-0.5 relative">
                                          <AnimatePresence mode="wait">
                                            {isLocked ? (
                                              <motion.div
                                                key="locked"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                              >
                                                <Lock className="h-7 w-7 text-muted-foreground" />
                                              </motion.div>
                                            ) : isCompleted ? (
                                              <motion.div
                                                key="completed"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0, rotate: 180 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                              >
                                                <CheckCircle className="h-7 w-7 text-green-500" />
                                              </motion.div>
                                            ) : isActive ? (
                                              <motion.div
                                                key="active"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="relative"
                                              >
                                                <Play className="h-7 w-7 text-primary fill-primary" />
                                                <motion.div
                                                  animate={{ scale: [1, 1.2, 1] }}
                                                  transition={{ repeat: Infinity, duration: 2 }}
                                                  className="absolute inset-0 rounded-full bg-primary/20"
                                                />
                                              </motion.div>
                                            ) : !hasVideo ? (
                                              <motion.div
                                                key="no-video"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                              >
                                                <VideoOff className="h-7 w-7 text-muted-foreground/70" />
                                              </motion.div>
                                            ) : (
                                              <motion.div
                                                key="progress"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={cn(
                                                  "h-7 w-7 rounded-full border-2 relative overflow-hidden",
                                                  chapterProgress > 0 ? "border-primary" : "border-muted-foreground/30",
                                                )}
                                              >
                                                {chapterProgress > 0 && (
                                                  <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${chapterProgress}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="bg-primary h-full"
                                                  />
                                                )}
                                                {isHovered && (
                                                  <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-full"
                                                  >
                                                    <Play className="h-3 w-3 text-primary" />
                                                  </motion.div>
                                                )}
                                              </motion.div>
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Chapter Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <p className={cn(
                                          "line-clamp-2 leading-relaxed text-sm font-medium",
                                          isActive ? "text-primary" : 
                                          isCompleted ? "text-foreground" : "text-muted-foreground",
                                          !hasVideo && "italic",
                                          isLocked && "text-muted-foreground/70"
                                        )}>
                                          {safeChapter.title}
                                          {!hasVideo && " (No Video)"}
                                          {isLocked && " (Locked)"}
                                        </p>
                                        
                                        {/* Chapter Number Badge */}
                                        <Badge variant="outline" className="text-xs shrink-0 min-w-6 text-center">
                                          {chapterIndex + 1}
                                        </Badge>
                                      </div>
                                      
                                        {/* Duration and Progress Info */}
                                      <div className="flex items-center justify-between mt-3">
                                        {duration && hasVideo && !isLocked && (
                                          <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDuration(duration)}
                                          </div>
                                        )}
                                        
                                        {chapterProgress > 0 && chapterProgress < 100 && hasVideo && !isLocked && (
                                          <div className="text-xs text-primary font-medium">
                                            {Math.round(chapterProgress)}% watched
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Enhanced Progress Bar */}
                                      {chapterProgress > 0 && chapterProgress < 100 && hasVideo && !isLocked && (
                                        <motion.div 
                                          initial={{ scaleX: 0 }}
                                          animate={{ scaleX: 1 }}
                                          className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"
                                        >
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${chapterProgress}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full"
                                          />
                                        </motion.div>
                                      )}
                                    </div>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium">{safeChapter.title}</p>
                                    {duration && hasVideo && !isLocked && (
                                      <p className="text-xs text-muted-foreground">
                                        Duration: {formatDuration(duration)}
                                      </p>
                                    )}
                                    {chapterProgress > 0 && !isLocked && (
                                      <p className="text-xs text-muted-foreground">
                                        Progress: {Math.round(chapterProgress)}%
                                      </p>
                                    )}
                                    {!hasVideo && (
                                      <p className="text-xs text-muted-foreground">
                                        This chapter doesn't have a video
                                      </p>
                                    )}
                                    {isLocked && (
                                      <p className="text-xs text-muted-foreground">
                                        {!isAuthenticated ? "Sign in to access this chapter" : "Complete previous chapters to unlock"}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollArea>

        {/* Achievement Section */}
        {overallProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-border/50 bg-gradient-to-r from-primary/5 to-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {overallProgress === 100 ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </motion.div>
                ) : overallProgress >= 75 ? (
                  <Star className="h-8 w-8 text-primary" />
                ) : (
                  <Target className="h-8 w-8 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {overallProgress === 100 
                    ? "🎉 Course Completed!" 
                    : overallProgress >= 75 
                    ? "Almost there!" 
                    : "Keep going!"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overallProgress === 100 
                    ? "Congratulations on completing this course!"
                    : `${courseStatistics.remainingChapters} chapters left to complete`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default React.memo(VideoNavigationSidebar);