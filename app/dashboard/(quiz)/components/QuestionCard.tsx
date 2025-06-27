import { motion } from "framer-motion"
import { CheckCircle, XCircle, BookOpen, Clock, Code } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProcessedAnswer } from "./quiz-result-types"
import CodeQuizEditor from "../code/components/CodeQuizEditor"

interface QuestionCardProps {
  question: ProcessedAnswer
  index: number
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const noAnswerSelected = !question.userAnswerId
  return (
    <motion.div
      key={question.questionId}
      className="p-6 rounded-2xl border-2 border-muted/30 bg-gradient-to-r from-background to-muted/5 shadow-lg hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            question.isCorrect 
              ? "bg-green-100 text-green-600 border-2 border-green-200" 
              : "bg-red-100 text-red-600 border-2 border-red-200"
          }`}
        >
          {question.isCorrect ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-foreground">
              Question {index + 1}
            </h3>
            <div className="flex items-center gap-2">
              {question.difficulty && (
                <Badge variant="outline" className="text-xs">
                  {question.difficulty}
                </Badge>
              )}
              {question.timeSpent && question.timeSpent > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round(question.timeSpent / 1000)}s
                </Badge>
              )}
            </div>
          </div>          <p className="text-foreground mb-4 text-base leading-relaxed">
            {question.question}
          </p>
          
          {/* Code Snippet Display for Code Quiz */}
          {question.codeSnippet && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-700">Code Snippet:</span>
                {question.language && (
                  <Badge variant="outline" className="text-xs">
                    {question.language}
                  </Badge>
                )}
              </div>
              <CodeQuizEditor
                value={question.codeSnippet}
                onChange={() => {}}
                language={question.language || "javascript"}
                readOnly={true}
                className="mb-4"
              />
            </div>
          )}
          
          {/* All Options Display */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Answer Options
            </h4>
            {question.allOptions.map((option, optIndex) => {
              const isUserChoice = option.id === question.userAnswerId
              const isCorrectChoice = option.id === question.correctAnswerId
              let optionStyle = "bg-muted/20 border-muted/30"
              let textStyle = "text-muted-foreground"
              let iconElement = null
              if (isUserChoice && isCorrectChoice) {
                optionStyle = "bg-green-50 border-green-200 ring-2 ring-green-100"
                textStyle = "text-green-700"
                iconElement = <CheckCircle className="w-5 h-5 text-green-600" />
              } else if (isUserChoice && !isCorrectChoice) {
                optionStyle = "bg-red-50 border-red-200 ring-2 ring-red-100"
                textStyle = "text-red-700"
                iconElement = <XCircle className="w-5 h-5 text-red-600" />
              } else if (!isUserChoice && isCorrectChoice) {
                optionStyle = noAnswerSelected 
                  ? "bg-green-50 border-green-200 ring-2 ring-green-100"
                  : "bg-green-50 border-green-200"
                textStyle = "text-green-700"
                iconElement = <CheckCircle className="w-5 h-5 text-green-600" />
              }
              return (
                <motion.div
                  key={option.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${optionStyle}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-muted/30 flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span className={`flex-1 font-medium ${textStyle}`}>
                      {option.text}
                    </span>
                    {iconElement && (
                      <div className="flex items-center gap-2">
                        {isUserChoice && (
                          <Badge variant="outline" className={`text-xs ${isCorrectChoice ? "text-green-600" : "text-red-600"}`}>
                            Your Choice
                          </Badge>
                        )}
                        {isCorrectChoice && !isUserChoice && !question.userAnswerId && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            Correct Option
                          </Badge>
                        )}
                        {iconElement}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
     
        </div>
      </div>
    </motion.div>
  )
}
