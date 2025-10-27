"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, TrendingUp, BookOpen, Clock, Play, Pause } from "lucide-react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Course {
  id: number
  courseName: string
  totalUnits: number
  totalChapters: number
  category: string
  slug: string
}

interface Props {
  courseDetails: Course[]
}

const categoryColors: Record<string, string> = {
  "cloud-computing": "bg-[hsl(var(--category-cloud-computing))] text-white border-[hsl(var(--category-cloud-computing))]",
  "web-development": "bg-[hsl(var(--category-web-development))] text-white border-[hsl(var(--category-web-development))]",
  "data-science": "bg-[hsl(var(--category-data-science))] text-black border-[hsl(var(--category-data-science))]",
}

const categoryGradients: Record<string, string> = {
  "cloud-computing": "from-blue-500/10 via-cyan-500/5 to-transparent",
  "web-development": "from-emerald-500/10 via-green-500/5 to-transparent",
  "data-science": "from-purple-500/10 via-violet-500/5 to-transparent",
}

const svgBackgrounds: Record<string, string> = {
  "cloud-computing": "/svg/cloud-bg.svg",
  "web-development": "/svg/web-bg.svg",
  "data-science": "/svg/data-bg.svg",
}

export default function PopularCourseSpotlight({ courseDetails }: Props) {
  const sortedCourses = useMemo(() => {
    return [...courseDetails].slice(0, 5)
  }, [courseDetails])

  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout

    if (isPlaying) {
      // Progress animation
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 0
          }
          return prev + (100 / 40) // 4 seconds = 40 intervals of 100ms
        })
      }, 100)

      // Course switching
      interval = setInterval(() => {
        setIndex(prev => (prev + 1) % sortedCourses.length)
        setProgress(0)
      }, 4000)
    }

    return () => {
      clearInterval(interval)
      clearInterval(progressInterval)
    }
  }, [sortedCourses.length, isPlaying])

  const currentCourse = sortedCourses[index]
  const category = currentCourse?.category?.toLowerCase()
  const badgeColor = categoryColors[category] || "bg-muted text-muted-foreground border-border"
  const gradientColor = categoryGradients[category] || "from-muted/10 to-transparent"
  const backgroundSvg = svgBackgrounds[category]

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleDotClick = (dotIndex: number) => {
    setIndex(dotIndex)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Header with enhanced styling */}


      {/* Main course spotlight with enhanced animations */}
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden z-20">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>

        <div className="relative h-[200px] sm:h-[220px] mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCourse?.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.25, 0.46, 0.45, 0.94],
                scale: { duration: 0.3 }
              }}
              className="absolute inset-0"
            >
              <Link href={`/dashboard/course/${currentCourse.slug}`} className="block h-full group">
                <Card className="relative overflow-hidden h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card">
                  {/* Gradient overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-70",
                    gradientColor
                  )} />
                  
                  {/* SVG Background with enhanced styling */}
                  {backgroundSvg && (
                    <div className="absolute inset-0 z-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                      <Image
                        src={backgroundSvg}
                        alt=""
                        fill
                        className="object-cover scale-110 group-hover:scale-105 transition-transform duration-700"
                        priority={false}
                      />
                    </div>
                  )}

                  {/* Animated background particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary/10 rounded-full"
                        animate={{
                          x: [0, 100, 0],
                          y: [0, -50, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 4 + i,
                          repeat: Infinity,
                          delay: i * 1.5,
                          ease: "easeInOut"
                        }}
                        style={{
                          left: `${20 + i * 30}%`,
                          top: `${60 + i * 10}%`,
                        }}
                      />
                    ))}
                  </div>

                  <CardContent className="relative z-10 p-6 flex flex-col justify-between h-full">
                    {/* Header section */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <motion.h3 
                          className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          {currentCourse.courseName}
                        </motion.h3>
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge className={cn(
                            "text-xs font-medium border transition-all duration-200 hover:scale-105",
                            badgeColor
                          )}>
                            {currentCourse.category.replace("-", " ")}
                          </Badge>
                        </motion.div>
                      </div>

                      {/* Course stats with icons */}
                      <motion.div 
                        className="flex items-center gap-4 text-sm text-muted-foreground"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{currentCourse.totalUnits} Unit{currentCourse.totalUnits > 1 ? "s" : ""}</span>
                        </div>
                        <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{currentCourse.totalChapters} Chapter{currentCourse.totalChapters > 1 ? "s" : ""}</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Bottom section with enhanced CTA */}
                    <motion.div 
                      className="flex items-center justify-between pt-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2 text-sm text-primary font-medium group-hover:text-primary/80 transition-colors">
                        <span>Start Learning</span>
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handlePlayPause()
                          }}
                          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors duration-200"
                        >
                          {isPlaying ? (
                            <Pause className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Play className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced navigation dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {sortedCourses.map((_, dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => handleDotClick(dotIndex)}
              className={cn(
                "transition-all duration-300 rounded-full",
                index === dotIndex
                  ? "w-8 h-2 bg-primary neo-shadow"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-125"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

