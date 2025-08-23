"use client"

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, CheckCircle, Download, FileText, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressOverlayProps {
  type: 'chapter-end' | 'course-end' | 'quiz-end'
  isActive: boolean
  title: string
  subtitle?: string
  completionPercentage?: number
  onContinue?: () => void
  onStartQuiz?: () => void
  onCertificateDownload?: () => void
  isCertificateAvailable?: boolean
  animationDelay?: number
  nextChapter?: {
    title: string
    onStart: () => void
  }
}

export function ProgressOverlay({
  type,
  isActive,
  title,
  subtitle,
  completionPercentage = 0,
  onContinue,
  onStartQuiz,
  onCertificateDownload,
  isCertificateAvailable = false,
  animationDelay = 0,
  nextChapter
}: ProgressOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: animationDelay, duration: 0.5 }}
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <Card className={cn(
            "max-w-md w-full bg-card/95",
            type === 'course-end' && "border-primary/30"
          )}>
            <CardHeader className={cn(
              "pb-4",
              type === 'course-end' && "pb-6"
            )}>
              <div className="flex justify-center mb-4">
                {type === 'chapter-end' && (
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                )}
                {type === 'course-end' && (
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                )}
                {type === 'quiz-end' && (
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              <CardTitle className="text-center text-xl">
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="text-center mt-2">
                  {subtitle}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {completionPercentage > 0 && (
                <div className="text-center text-sm">
                  <div className="mb-1 font-medium">Course Progress</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 rounded-full bg-muted w-48 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${completionPercentage}%` }} 
                      />
                    </div>
                    <span className="text-xs font-medium">{completionPercentage}%</span>
                  </div>
                </div>
              )}
              
              {nextChapter && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="text-muted-foreground mb-1">Up Next</div>
                  <div className="font-medium truncate">{nextChapter.title}</div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className={cn(
              "flex flex-col gap-3", 
              type === 'course-end' && "pb-6"
            )}>
              {onContinue && (
                <Button
                  className="w-full"
                  onClick={onContinue}
                >
                  Continue
                </Button>
              )}
              
              {nextChapter && (
                <Button
                  className="w-full"
                  onClick={nextChapter.onStart}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Next Chapter
                </Button>
              )}
              
              {onStartQuiz && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onStartQuiz}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Take Quiz
                </Button>
              )}
              
              {type === 'course-end' && onCertificateDownload && (
                <Button
                  variant={isCertificateAvailable ? "default" : "outline"}
                  className="w-full"
                  onClick={onCertificateDownload}
                  disabled={!isCertificateAvailable}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isCertificateAvailable 
                    ? "Download Certificate" 
                    : "Complete Course to Unlock Certificate"
                  }
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
