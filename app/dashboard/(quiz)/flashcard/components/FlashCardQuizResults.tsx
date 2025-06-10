"use client"

import React, { useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Award, Clock, Activity, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FlashCardResultsProps {
  quizId?: string
  slug: string
  title?: string
  score?: number
  totalQuestions?: number
  correctAnswers?: number
  totalTime?: number
  onRestart?: () => void
  onReview?: (cards: number[]) => void
}

export default function FlashCardResults({
  slug,
  title = "Flashcard Quiz",
  score = 0,
  totalQuestions = 0,
  correctAnswers = 0,
  totalTime = 0,
  onRestart,
  onReview,
}: FlashCardResultsProps) {
  const router = useRouter()
  
  // Memoize calculations to avoid recalculating on every render
  const { formattedTime, accuracyPercentage, cardsPerMinute } = useMemo(() => {
    // Format time from seconds to minutes and seconds
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;
    const formattedTime = `${mins}m ${secs}s`;
    
    // Calculate metrics
    const accuracyPercentage = Math.round(score);
    const cardsPerMinute = totalTime > 0 ? 
      Math.round((totalQuestions / (totalTime / 60)) * 10) / 10 : 0;
    
    return { formattedTime, accuracyPercentage, cardsPerMinute };
  }, [totalTime, score, totalQuestions]);

  // Memoize handlers to prevent recreating functions on every render
  const handleRetake = useCallback(() => {
    if (onRestart) {
      onRestart();
    } else {
      router.push(`/dashboard/flashcard/${slug}?reset=true&t=${Date.now()}`);
    }
  }, [onRestart, router, slug]);

  const handleViewAll = useCallback(() => {
    router.push("/dashboard/quizzes");
  }, [router]);

  // Optimized animation variants with hardware acceleration and smoother transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.08, // Slightly faster stagger for better UX
        ease: "easeOut",
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 15, // Slightly smaller movement for subtler animation
      willChange: 'transform, opacity'
    },
    visible: { 
      opacity: 1, 
      y: 0,
      willChange: 'transform, opacity',
      transition: {
        type: "spring",
        stiffness: 500, // More responsive spring
        damping: 25,
        mass: 0.8 // Lower mass for snappier feel
      }
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      layout
      layoutRoot // Optimize layout animations
    >
      <motion.div
        variants={itemVariants}
        className="text-center mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title} Completed!</h1>
        <p className="text-muted-foreground">You've completed your flashcard session.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">{correctAnswers} / {totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                  <p className="text-2xl font-bold">{formattedTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-2 rounded-full">
                  <BarChart3 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">{accuracyPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Card Rate</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-2xl font-bold">{cardsPerMinute}/min</p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cards reviewed per minute</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button onClick={handleRetake} className="sm:w-auto flex-1 max-w-xs">
          Retake Flashcards
        </Button>
        <Button 
          onClick={handleViewAll} 
          variant="outline" 
          className="sm:w-auto flex-1 max-w-xs"
        >
          View All Quizzes
        </Button>
      </motion.div>
    </motion.div>
  )
}
