"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Award, 
  BookOpen, 
  ChevronRight, 
  X, 
  Play, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RelatedCourse, PersonalizedRecommendation, QuizSuggestion } from '@/services/recommendationsService'

type OverlayType = 'completed' | 'nextChapter' | 'autoPlay' | 'certificate'

interface UnifiedVideoOverlayProps {
  type: OverlayType
  title?: string
  subtitle?: string
  countdown?: number
  
  // Completed video specific
  courseTitle?: string
  relatedCourses?: RelatedCourse[]
  quizSuggestions?: QuizSuggestion[]
  personalizedRecommendations?: PersonalizedRecommendation[]
  isKeyChapter?: boolean
  isLastVideo?: boolean
  
  // Next chapter specific
  chapterTitle?: string
  
  // Actions
  onClose?: () => void
  onContinue?: () => void
  onCancel?: () => void
  onCertificateClick?: () => void
  
  // Styling
  className?: string
}

const overlayConfig = {
  completed: {
    bgClass: "bg-background/95 backdrop-blur-sm",
    animation: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  },
  nextChapter: {
    bgClass: "bg-background/90 backdrop-blur-sm",
    animation: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
  },
  autoPlay: {
    bgClass: "bg-background/95 backdrop-blur-sm",
    animation: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } }
  },
  certificate: {
    bgClass: "bg-background/98 backdrop-blur-md",
    animation: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } }
  }
}

const UnifiedVideoOverlay: React.FC<UnifiedVideoOverlayProps> = ({
  type,
  title,
  subtitle,
  countdown,
  courseTitle,
  relatedCourses = [],
  quizSuggestions = [],
  personalizedRecommendations = [],
  isKeyChapter = false,
  isLastVideo = false,
  chapterTitle,
  onClose,
  onContinue,
  onCancel,
  onCertificateClick,
  className
}) => {
  const config = overlayConfig[type]

  const renderContent = () => {
    switch (type) {
      case 'completed':
        return (
          <div className="max-w-lg w-full text-center">
            {/* Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="mb-6"
            >
              <div className="flex justify-center mb-4">
                {isLastVideo ? (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isLastVideo ? "Course Complete!" : "Chapter Complete!"}
              </h2>
              <p className="text-muted-foreground">
                {isLastVideo 
                  ? `Congratulations! You've completed "${courseTitle}"`
                  : "Great job! Ready for the next challenge?"
                }
              </p>
            </motion.div>

            {/* Certificate Button for Last Video */}
            {isLastVideo && isKeyChapter && onCertificateClick && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <Button onClick={onCertificateClick} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  <Award className="h-4 w-4" />
                  Download Certificate
                </Button>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-6 mb-6"
            >
              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3">Continue Learning</h3>
                  <div className="space-y-2">
                    {relatedCourses.slice(0, 2).map((rec) => (
                      <Card key={rec.id} className="p-3 bg-accent/5 border-accent/10">
                        <a 
                          href={`/dashboard/course/${rec.slug}`}
                          className="flex items-center gap-3 text-left"
                        >
                          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{rec.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {rec.matchReason || "Recommended based on your interests"}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </a>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Suggestions */}
              {quizSuggestions.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-3">Test Your Knowledge</h3>
                  <div className="space-y-2">
                    {quizSuggestions.slice(0, 2).map((quiz) => (
                      <Card key={quiz.id} className="p-3 bg-primary/5 border-primary/10">
                        <a 
                          href={`/dashboard/quizzes/${quiz.type}/${quiz.id}`}
                          className="flex items-center gap-3 text-left"
                        >
                          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            {quiz.icon || "Q"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{quiz.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {quiz.type === 'mcq' ? 'Multiple Choice Quiz' : 
                               quiz.type === 'code' ? 'Code Challenge' : 
                               'Practice Quiz'}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </a>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Close Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button variant="outline" onClick={onClose} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </motion.div>
          </div>
        )

      case 'nextChapter':
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="max-w-md w-full bg-card border rounded-xl p-6 shadow-lg"
          >
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                {countdown ? (
                  <span className="text-2xl font-bold text-primary">{countdown}</span>
                ) : (
                  <Play className="h-6 w-6 text-primary" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {countdown ? 'Next Chapter' : 'Continue Watching'}
              </h3>
              <p className="text-muted-foreground text-sm">{chapterTitle || title}</p>
              {countdown && (
                <p className="text-xs text-muted-foreground mt-2">
                  Auto-playing in {countdown} seconds
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Button onClick={onContinue} className="w-full gap-2" size="lg">
                <Play className="h-4 w-4" />
                {countdown ? 'Play Now' : 'Continue'}
              </Button>
              <Button onClick={onCancel} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </motion.div>
        )

      case 'autoPlay':
        return (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium">{title || "Ready for the next chapter?"}</h3>
                <p className="text-sm text-muted-foreground">
                  {subtitle || `Continuing in ${countdown || 10} seconds. Click play to continue now.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onCancel} className="gap-1">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" onClick={onContinue} className="gap-1">
                  <Play className="h-4 w-4" /> Continue
                </Button>
              </div>
            </div>
          </div>
        )

      case 'certificate':
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="max-w-md w-full bg-card border rounded-xl p-6 shadow-lg text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 mx-auto mb-4 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Congratulations!</h3>
            <p className="text-muted-foreground mb-6">
              You've successfully completed the course. Download your certificate to showcase your achievement.
            </p>
            <div className="space-y-2">
              <Button onClick={onCertificateClick} className="w-full gap-2" size="lg">
                <Award className="h-4 w-4" />
                Download Certificate
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  const positioning = type === 'autoPlay' 
    ? {} 
    : { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem' 
      }

  return (
    <motion.div
      {...config.animation}
      className={cn(
        "absolute inset-0 z-40",
        config.bgClass,
        className
      )}
      style={positioning}
    >
      {renderContent()}
    </motion.div>
  )
}

export default React.memo(UnifiedVideoOverlay)