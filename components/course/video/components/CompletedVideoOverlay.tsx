"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trophy, Award, BookOpen, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBestQuizHref } from '@/utils/navigation'
import type { RelatedCourse, PersonalizedRecommendation, QuizSuggestion } from '@/services/recommendationsService'

interface CompletedVideoOverlayProps {
  courseTitle: string
  relatedCourses: RelatedCourse[]
  quizSuggestions: QuizSuggestion[]
  personalizedRecommendations: PersonalizedRecommendation[]
  onClose: () => void
  onCertificateClick: () => void
  isKeyChapter: boolean
  isLastVideo: boolean
}

const CompletedVideoOverlay: React.FC<CompletedVideoOverlayProps> = ({
  courseTitle,
  relatedCourses,
  quizSuggestions,
  personalizedRecommendations,
  onClose,
  onCertificateClick,
  isKeyChapter,
  isLastVideo,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-lg w-full text-center mb-8"
      >
        {/* Header animation */}
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
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {isLastVideo ? "Course Completed!" : "Chapter Completed!"}
          </h2>
          
          <p className="text-muted-foreground">
            {isLastVideo
              ? `Congratulations! You've completed "${courseTitle}". Get your certificate to celebrate this achievement.`
              : `Great work! You've completed this chapter of "${courseTitle}".`}
          </p>
        </motion.div>

        {/* Course completion actions */}
        {isLastVideo && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            <Button onClick={onCertificateClick} size="lg" className="gap-2">
              <Award className="h-4 w-4" />
              Get Your Certificate
            </Button>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {/* Personalized recommendations */}
          {personalizedRecommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-3">Recommended Next Steps</h3>
              <div className="space-y-2">
                {personalizedRecommendations.slice(0, 2).map((rec) => (
                  <Card key={rec.id} className="p-3 bg-primary/5 border-primary/10">
                    <a 
                      href={`/dashboard/course/${rec.slug}`}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center",
                        "bg-primary/10 text-primary"
                      )}>
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

          {/* Quiz suggestions */}
          {quizSuggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-sm mb-3">Test Your Knowledge</h3>
              <div className="space-y-2">
                {quizSuggestions.slice(0, 2).map((quiz) => (
                  <Card key={quiz.id} className="p-3 bg-primary/5 border-primary/10">
                    <a 
                      href={getSafeQuizHref('mcq', (quiz as any).slug)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-md flex items-center justify-center",
                        "bg-primary/10 text-primary"
                      )}>
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

        {/* Close button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default React.memo(CompletedVideoOverlay)
