"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Clock,
  ChevronRight,
  StickyNote,
  Loader2,
  Star,
  Users,
  Zap,
  Target,
  Brain,
  Code2,
  BookOpen,
  PenTool,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes";
import type React from "react";

// Interface for component props
interface RandomQuizEmbeddedProps {
  stats?: {
    totalQuizzes?: number;
    averageRating?: number;
    totalAttempts?: number;
  };
  isVisible?: boolean;
  className?: string;
  showHeader?: boolean;
  showStats?: boolean;
  showShuffle?: boolean;
}

// Interface for quiz data
interface QuizData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  quizType: string;
  difficulty?: string;
  duration?: number;
  rating?: number;
  completionRate?: number;
  popularity?: string;
  attempts?: number;
}

const quizTypeColors = {
  blanks: {
    badge: "bg-blue-500 text-white",
    icon: "text-blue-500",
    border: "border-blue-200",
  },
  flashcard: {
    badge: "bg-orange-500 text-white",
    icon: "text-orange-500",
    border: "border-orange-200",
  },
  openended: {
    badge: "bg-purple-500 text-white",
    icon: "text-purple-500",
    border: "border-purple-200",
  },
  code: {
    badge: "bg-green-500 text-white",
    icon: "text-green-500",
    border: "border-green-200",
  },
  mcq: {
    badge: "bg-indigo-500 text-white",
    icon: "text-indigo-500",
    border: "border-indigo-200",
  },
};

const difficultyColors = {
  Easy: "bg-green-500 text-white",
  Medium: "bg-amber-500 text-white",
  Hard: "bg-red-500 text-white",
};

const quizTypeRoutes = {
  blanks: "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
};

const quizTypeIcons = {
  blanks: PenTool,
  flashcard: StickyNote,
  openended: BookOpen,
  code: Code2,
  mcq: Brain,
};

const quizTypeLabels = {
  blanks: "Fill Blanks",
  flashcard: "Flashcards",
  openended: "Open Ended",
  code: "Code Quiz",
  mcq: "Multiple Choice",
};

// Simple Quiz Card Component
const QuizCard: React.FC<{
  quiz: QuizData;
  isVisible: boolean;
}> = ({ quiz, isVisible }) => {
  const Icon = quizTypeIcons[quiz.quizType as keyof typeof quizTypeIcons] || Brain;
  const colorScheme = quizTypeColors[quiz.quizType as keyof typeof quizTypeColors] || quizTypeColors.mcq;
  const difficultyColor = quiz.difficulty
    ? difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
    : difficultyColors.Medium;

  if (!isVisible) return null;

  return (
    <Card className="h-full border border-border hover:border-primary/50 transition-colors duration-200 bg-card shadow-sm hover:shadow-md">
      <CardHeader className="space-y-3 p-4">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg bg-muted/50 ${colorScheme.border} border`}>
            <Icon className={`h-5 w-5 ${colorScheme.icon}`} />
          </div>
          {quiz.rating && (
            <div className="flex items-center space-x-1 bg-muted/50 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium">{quiz.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg font-bold text-foreground line-clamp-2 leading-tight">
          {quiz.title}
        </CardTitle>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${colorScheme.badge} text-xs`}>
            {quizTypeLabels[quiz.quizType as keyof typeof quizTypeLabels] || quiz.quizType}
          </Badge>
          {quiz.difficulty && (
            <Badge className={`${difficultyColor} text-xs`}>
              {quiz.difficulty}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1">
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {quiz.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {quiz.duration && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.duration} min</span>
            </div>
          )}
          {quiz.attempts && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.attempts}</span>
            </div>
          )}
          {quiz.completionRate && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Target className={`h-4 w-4 ${colorScheme.icon}`} />
              <span className="font-medium">{quiz.completionRate}%</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Zap className={`h-4 w-4 ${colorScheme.icon}`} />
            <span className="font-medium">Interactive</span>
          </div>
        </div>

        {quiz.completionRate && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Completion Rate
              </span>
              <span className="text-xs font-bold text-primary">{quiz.completionRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${colorScheme.badge} transition-all duration-500 ease-out`}
                style={{ width: `${quiz.completionRate}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <Link
          href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes]}/${quiz.slug}`}
          className="w-full"
          prefetch={true}
        >
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 transition-colors duration-200">
            <span className="flex items-center justify-center space-x-2">
              <span>Start Quiz</span>
              <ChevronRight className="h-4 w-4" />
            </span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Main RandomQuiz Embedded Component
export const RandomQuiz: React.FC<RandomQuizEmbeddedProps> = ({ 
  stats = {}, 
  isVisible = true,
  className,
  showHeader = false,
  showStats = false,
  showShuffle = false
}) => {
  const { quizzes, isLoading, error, refresh } = useRandomQuizzes(8);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  const processedQuizzes = useMemo(() => {
    if (!quizzes?.length) return [];
    return quizzes.map((quiz: any, index: number): QuizData => ({
      id: quiz.id || `processed-${index}`,
      slug: quiz.slug || quiz.id || `processed-${index}`,
      title: quiz.title || "Untitled Quiz",
      description: quiz.description,
      quizType: quiz.quizType || "mcq",
      difficulty: quiz.difficulty,
      duration: quiz.duration,
      rating: quiz.rating,
      completionRate: quiz.completionRate,
      popularity: quiz.popularity,
      attempts: quiz.attempts,
    }));
  }, [quizzes]);

  const nextCard = useCallback(() => {
    if (processedQuizzes.length <= 1) return;
    setActiveCardIndex((prev) => (prev + 1) % processedQuizzes.length);
  }, [processedQuizzes.length]);

  const prevCard = useCallback(() => {
    if (processedQuizzes.length <= 1) return;
    setActiveCardIndex((prev) =>
      prev === 0 ? processedQuizzes.length - 1 : prev - 1
    );
  }, [processedQuizzes.length]);

  const handleRefresh = useCallback(() => {
    refresh();
    setActiveCardIndex(0);
  }, [refresh]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      className
    )}>
      {/* Quiz Content */}
      <div className="flex-1 relative">
        {isLoading && !processedQuizzes.length ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              Loading amazing quizzes for you...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive text-center">
                Failed to load quizzes. Please try again.
              </p>
            </div>
            {showShuffle && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                Retry
              </Button>
            )}
          </div>
        ) : processedQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="p-6 bg-muted/50 rounded-lg border border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                No quizzes available at the moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Quiz Card */}
            <div className="h-full">
              {processedQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    index === activeCardIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  <QuizCard
                    quiz={quiz}
                    isVisible={index === activeCardIndex}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Controls */}
            {processedQuizzes.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-background/95 border border-border/50 rounded-full px-4 py-2 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevCard}
                  className="h-8 w-8 rounded-full hover:bg-muted transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {processedQuizzes.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        index === activeCardIndex
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      onClick={() => setActiveCardIndex(index)}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextCard}
                  className="h-8 w-8 rounded-full hover:bg-muted transition-colors duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
