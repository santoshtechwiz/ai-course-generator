"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Check, Clock, HelpCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"

interface Option {
  id: string
  text: string
}

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: (string | { id: string; text: string })[]
  }
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  isLastQuestion?: boolean
  existingAnswer?: string
  onNavigate?: (direction: "next" | "prev") => void
}

const McqQuiz = ({
  question,
  onAnswer,
  isSubmitting,
  questionNumber = 1,
  totalQuestions = 1,
  isLastQuestion,
  existingAnswer,
  onNavigate,
}: McqQuizProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(existingAnswer || null)
  const [isAnswerSaved, setIsAnswerSaved] = useState(!!existingAnswer)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  // Use the question text field or fall back to the question field
  const questionText = question.text || question.question || "Question text unavailable"

  // Update selected option when existingAnswer changes
  useEffect(() => {
    if (existingAnswer) {
      setSelectedOption(existingAnswer)
      setIsAnswerSaved(true)
    } else {
      setIsAnswerSaved(false)
    }
  }, [existingAnswer, question.id])

  const options = useMemo(() => {
    if (!question?.options || !Array.isArray(question.options)) return []

    return question.options.map((option, index) => {
      if (typeof option === "string") {
        return { id: option, text: option }
      }
      if (option && typeof option === "object" && option.id && option.text) {
        return option
      }
      // Fallback for malformed options
      return { id: `option_${index}`, text: String(option || `Option ${index + 1}`) }
    })
  }, [question?.options])

  const handleSubmit = useCallback(() => {
    if (!selectedOption || isSubmitting) return

    // Pass the selected option to the parent component
    onAnswer(selectedOption)
    setIsAnswerSaved(true)
  }, [selectedOption, isSubmitting, onAnswer])

  // Handle option selection
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOption(optionId)
    setIsAnswerSaved(false)
  }, [])

  // Add this function to directly handle navigation
  const handleDirectNavigation = useCallback((direction: "next" | "prev") => {
    console.log(`Direct navigation button clicked: ${direction}`);
    onNavigate?.(direction);
  }, [onNavigate]);

  // Calculate progress
  const progressPercentage = (questionNumber / totalQuestions) * 100;

  // Validate question data
  if (!question || (!questionText) || !options.length) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-3">Question Unavailable</h3>
          <p className="text-muted-foreground mb-6">
            We're having trouble loading this question. Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden">
        {/* Enhanced Header */}
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 p-6">
          <div className="space-y-4">
            {/* Question Counter and Progress */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    Question {questionNumber}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    of {totalQuestions} questions
                  </CardDescription>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(progressPercentage)}%
                </div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={progressPercentage} 
                className="h-3 bg-muted/50"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Progress through quiz</span>
                <div className="flex gap-1">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i + 1 === questionNumber 
                          ? 'bg-primary scale-125' 
                          : i + 1 < questionNumber 
                            ? 'bg-green-500' 
                            : 'bg-muted'
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: i + 1 === questionNumber ? 1.25 : 1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Question Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20 mb-6">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Choose the best answer
                </span>
              </div>
              
              <h3 className="text-xl font-semibold leading-relaxed text-foreground max-w-3xl mx-auto">
                {questionText}
              </h3>
            </motion.div>

            {/* Options */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <AnimatePresence>
                {options.map((option, index) => {
                  const isSelected = selectedOption === option.id;
                  const isHovered = hoveredOption === option.id;
                  
                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <motion.div
                        className={`
                          relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                          ${isSelected 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                            : isHovered 
                              ? 'border-primary/50 bg-muted/50 shadow-md' 
                              : 'border-border bg-card hover:bg-muted/30'
                          }
                          ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}
                        `}
                        onClick={() => !isSubmitting && handleOptionSelect(option.id)}
                        onMouseEnter={() => setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Custom Radio Button */}
                          <div className="relative flex-shrink-0">
                            <div
                              className={`
                                w-6 h-6 rounded-full border-2 transition-all duration-300
                                ${isSelected 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground/30 bg-background'
                                }
                              `}
                            >
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          
                          {/* Option Text */}
                          <div className="flex-1">
                            <span className={`
                              text-base font-medium transition-colors duration-200
                              ${isSelected ? 'text-primary' : 'text-foreground'}
                            `}>
                              {option.text}
                            </span>
                          </div>
                          
                          {/* Selection Indicator */}
                          <AnimatePresence>
                            {isSelected && isAnswerSaved && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="flex-shrink-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Option Number Badge */}
                        <div className={`
                          absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold
                          flex items-center justify-center transition-all duration-300
                          ${isSelected 
                            ? 'bg-primary text-white' 
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Save Answer Button */}
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {!isAnswerSaved ? (
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedOption || isSubmitting}
                  size="lg"
                  className="px-8 py-3 text-base font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Answer
                    </>
                  )}
                </Button>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Answer saved!
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </CardContent>

        {/* Enhanced Navigation */}
        <div className="border-t border-border/50 bg-muted/20 p-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => handleDirectNavigation('prev')}
              disabled={questionNumber === 1 || isSubmitting}
              size="lg"
              className="flex items-center gap-2 px-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Question {questionNumber} of {totalQuestions}</span>
            </div>
            
            {!isLastQuestion ? (
              <Button
                variant="outline"
                onClick={() => handleDirectNavigation('next')}
                disabled={isSubmitting}
                size="lg"
                className="flex items-center gap-2 px-6"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onNavigate?.('next')}
                disabled={isSubmitting || !isAnswerSaved}
                size="lg"
                className="flex items-center gap-2 px-6 bg-primary hover:bg-primary/90"
              >
                Finish Quiz
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default McqQuiz