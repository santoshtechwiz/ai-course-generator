"use client"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { QuizResultLayout } from "../../components/QuizResultLayout"

interface McqQuizResultProps {
  result: {
    title?: string
    slug?: string
    quizId?: string
    score: number
    maxScore: number
    percentage: number
    completedAt?: string
    totalTime?: number
    questions?: Array<any>  // Original quiz questions with options
    answers?: Array<any>    // Original answer data with selectedOptionId
    questionResults: Array<{
      questionId: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      options?: Array<{ id: string; text: string }>
      selectedOptionId?: string // Added field for selectedOptionId
    }>
  }
  onRetake?: () => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  // Apply defensive coding to handle potential null/undefined values
  const title = result?.title || ""
  const slug = result?.slug || ""
  const quizId = result?.quizId || ""
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : 0
  const percentage = typeof result?.percentage === "number" ? result.percentage : 0
  const questionResults = Array.isArray(result?.questionResults) ? result.questionResults : []
  const completedAt = result?.completedAt || new Date().toISOString()
  const totalTime = result?.totalTime || 0

  // Enhanced title resolution with multiple fallbacks
  const getQuizTitle = () => {
    // Priority 1: Use provided title if it's meaningful
    if (title && title.trim() && !title.match(/^[a-zA-Z0-9]{6,}$/)) {
      return title.trim()
    }

    // Priority 2: Generate from quiz metadata
    const quizIdentifier = slug || quizId || "quiz"

    // Check if it looks like a slug/ID (alphanumeric, short)
    if (quizIdentifier.match(/^[a-zA-Z0-9]{6,}$/)) {
      return "Multiple Choice Quiz"
    }

    // Priority 3: Use identifier if it looks like a proper title
    return quizIdentifier.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getQuizSubtitle = () => {
    const identifier = slug || quizId
    if (identifier && identifier !== title) {
      return `Quiz ID: ${identifier}`
    }
    return "Test your knowledge with multiple choice questions"
  }

  // Enhanced score validation with proper fallbacks
  const validatedScore = typeof score === "number" && score >= 0 ? score : 0
  const validatedMaxScore = typeof maxScore === "number" && maxScore > 0 ? maxScore : questionResults?.length || 1

  // Count correct answers from questionResults as backup
  const correctFromResults = questionResults?.filter((q) => q.isCorrect === true).length || 0
  const totalFromResults = questionResults?.length || 0

  // Use the most reliable source for final calculations
  const finalScore = validatedScore > 0 ? validatedScore : correctFromResults
  const finalMaxScore = validatedMaxScore > 1 ? validatedMaxScore : Math.max(totalFromResults, 1)

  // Calculate percentage with proper bounds checking  // Calculate percentage score
  const calculatedPercentage = finalMaxScore > 0 ? Math.round((finalScore / finalMaxScore) * 100) : 0;  
  const validatedPercentage =
    typeof percentage === "number" && percentage >= 0 ? Math.min(percentage, 100) : calculatedPercentage;
  const finalPercentage = Math.max(0, Math.min(validatedPercentage, 100));  
    // Prepare formatted questions for QuizResultLayout with enhanced answer extraction
  const formattedQuestions = Array.isArray(questionResults) ? questionResults.map(q => {
    // Extract user answer from multiple possible sources with priority order
    let userAnswerText = q.userAnswer;
    
    // Try to get the answer from the Redux state if available
    if ((!userAnswerText || userAnswerText === "") && result.answers) {
      // Safely look through the answers object for this question ID
      const answerObj = result.answers.find((ans: any) => 
        String(ans?.questionId) === String(q.questionId)
      );
      if (answerObj) {
        // Try multiple fields that might contain the user's answer
        userAnswerText = answerObj.userAnswer || 
                        answerObj.selectedOptionId || 
                        answerObj.text || 
                        userAnswerText;
      }
    }
    
    // 2. If result contains the original questions with options, match the selected answer to option text
    const originalQuestion = Array.isArray(result.questions) && result.questions.find((origQ: any) => 
      String(origQ.id) === String(q.questionId)
    );
    
    // If we found matching options in the original question
    if (originalQuestion?.options && Array.isArray(originalQuestion.options)) {
      // Try to find selected option by ID or by matching text
      const selectedOption = originalQuestion.options.find((opt: any) => {
        if (!userAnswerText) return false;
        
        return (
          // Match by option ID
          String(opt) === String(userAnswerText) ||
          // Match by option text
          String(opt) === String(userAnswerText) ||
          // Match by nested ID
          (opt.id && String(opt.id) === String(userAnswerText)) ||
          // Match by nested text
          (opt.text && String(opt.text) === String(userAnswerText))
        );
      });
      
      // If we found a matching option with text, use that
      if (selectedOption && selectedOption.text) {
        userAnswerText = selectedOption.text;
      }
    }    
    return {
      id: q.questionId || String(Math.random()),
      question: q.question || "",
      type: "MCQ",
      userAnswer: userAnswerText || null,
      correctAnswer: q.correctAnswer || "",
      isCorrect: Boolean(q.isCorrect),
      explanation: "", // No explanation field available in MCQ questions
      options: q.options || []
    };
  }) : [];

  const totalQuestions = finalMaxScore;
  const correctAnswers = finalScore;
  const incorrectAnswers = totalQuestions - correctAnswers;
  // Define safe event handlers that won't be undefined
  const handleRetry = () => {
    if (onRetake) {
      onRetake();
    } else {
      // Fallback if onRetake is undefined
      window.location.href = `/dashboard/quizzes/${slug || ''}`;
    }
  };

  const handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  return (
    <QuizResultLayout
      title={getQuizTitle()}
      subtitle={getQuizSubtitle()}
      score={finalScore}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      incorrectAnswers={incorrectAnswers}
      timeTaken={totalTime ? `${totalTime} seconds` : undefined}
      questions={formattedQuestions}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
    >
      {/* Question Review Section */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Question Review</h2>

        <div className="space-y-4">
          {questionResults?.map((questionResult, index) => (
            <motion.div
              key={questionResult.questionId}
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
              initial="hidden"
              animate="visible"
            >
              <Card
                className={cn(
                  "border-l-4 transition-all duration-200 hover:shadow-md",
                  questionResult.isCorrect
                    ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10"
                    : "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
                )}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            Question {index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <HelpCircle className="h-3 w-3 mr-1" />
                            MCQ
                          </Badge>
                          {questionResult.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed break-words">
                          {questionResult.question}
                        </p>
                      </div>
                    </div>

                    {/* Options Display */}
                    {questionResult.options && Array.isArray(questionResult.options) && questionResult.options.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Answer Options</span>
                        <div className="grid gap-2">
                          {questionResult.options.map((option, optionIndex) => {
                            // Apply defensive coding to avoid null reference errors
                            if (!option) return null;
                            
                            const optionId = option.id || `option-${optionIndex}`;
                            const optionText = option.text || `Option ${optionIndex + 1}`;
                            
                            // Enhanced matching logic that tries multiple comparison strategies
                            // Try multiple ways to determine if this was the user's answer
                            const isUserAnswer =
                              // Direct text/content matching
                              optionText === questionResult.userAnswer || 
                              // ID-based matching
                              optionId === questionResult.userAnswer ||
                              // Try matching on part of the ID or text (for partial matches)
                              (questionResult.userAnswer && 
                               (String(questionResult.userAnswer).includes(optionId) || 
                                String(optionId).includes(questionResult.userAnswer))) ||
                              // Additional pass for case-insensitive matching if needed
                              (questionResult.userAnswer && 
                                optionText.toLowerCase() === String(questionResult.userAnswer).toLowerCase());
                                
                            // Similar approach for correct answer matching
                            const isCorrectAnswer =
                              optionText === questionResult.correctAnswer || 
                              optionId === questionResult.correctAnswer ||
                              (questionResult.correctAnswer &&
                               (String(questionResult.correctAnswer).includes(optionId) ||
                                String(optionId).includes(questionResult.correctAnswer))) ||
                              // Additional pass for case-insensitive matching if needed
                              (questionResult.correctAnswer && 
                                optionText.toLowerCase() === String(questionResult.correctAnswer).toLowerCase());

                            return (
                              <div
                                key={optionId}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-sm transition-all break-words",
                                  isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-950/20",
                                  isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-950/20",
                                  !isUserAnswer && !isCorrectAnswer && "border-muted bg-muted/30",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                  )}
                                  <span
                                    className={cn(
                                      "flex-1 min-w-0",
                                      isCorrectAnswer && "font-medium text-green-700 dark:text-green-300",
                                      isUserAnswer && !isCorrectAnswer && "font-medium text-red-700 dark:text-red-300",
                                    )}
                                  >
                                    {optionText}
                                  </span>
                                  {isUserAnswer && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      Your Choice
                                    </Badge>
                                  )}
                                  {isCorrectAnswer && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-100 text-green-700 flex-shrink-0"
                                    >
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Fallback Answer Display */
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* User Answer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full flex-shrink-0",
                                questionResult.isCorrect ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                            <span className="text-sm font-medium text-muted-foreground">Your Answer</span>
                          </div>
                          <div
                            className={cn(
                              "p-3 rounded-lg border-2 break-words",
                              questionResult.isCorrect
                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
                            )}
                          >
                            {questionResult.userAnswer || (
                              <span className="text-muted-foreground italic">No answer selected</span>
                            )}
                          </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-muted-foreground">Correct Answer</span>
                          </div>
                          <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 break-words">
                            {questionResult.correctAnswer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </QuizResultLayout>
  )
}
