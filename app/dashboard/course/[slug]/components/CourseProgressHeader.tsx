"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { calculateCompletionPercentage } from "../utils/videoUtils"
import { Clock, Award, Book, Trophy } from "lucide-react"
import { motion } from "framer-motion"

interface CourseProgressHeaderProps {
  courseTitle: string
  completedChapters: string[] | number[]
  totalChapters: number
  estimatedTime?: string
  currentChapter?: string
}

const CourseProgressHeader: React.FC<CourseProgressHeaderProps> = ({
  courseTitle,
  completedChapters,
  totalChapters,
  estimatedTime,
  currentChapter
}) => {
  const progressPercentage = calculateCompletionPercentage(completedChapters, totalChapters)
  
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${progressPercentage}%`,
      transition: { duration: 1, delay: 0.5, ease: "easeOut" }
    }
  }
  
  return (
    <motion.div 
      className="bg-gradient-to-r from-background via-muted/30 to-background border-b border-border/50 backdrop-blur-sm"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-8">
          <motion.div className="flex-1 min-w-0 space-y-3 lg:space-y-4" variants={itemVariants}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl xl:text-4xl leading-tight line-clamp-2">
              {courseTitle}
            </h1>
            {currentChapter && (
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground"
                variants={itemVariants}
              >
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Book className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Currently watching</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{currentChapter}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 flex-shrink-0"
            variants={itemVariants}
          >
            {estimatedTime && (
              <motion.div 
                className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{estimatedTime}</span>
              </motion.div>
            )}
            
            <motion.div 
              className="bg-card border rounded-xl p-4 shadow-sm min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Progress</span>
                </div>
                <Badge variant="outline" className="bg-background">
                  {completedChapters.length}/{totalChapters}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
                  <span className="text-xs text-muted-foreground">Complete</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default CourseProgressHeader
