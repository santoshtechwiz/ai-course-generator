"use client"

import { useState, useCallback, useMemo, lazy, Suspense } from "react"
import { FileText, Plus, Trash2, Edit3, Save, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { InlineLoader } from "@/components/loaders"

// Lazy load PDF components for better performance
const EnhancedPDFDownloadButton = lazy(() =>
  import("./DocumentQuizPdf").then((module) => ({ default: module.PDFDownloadButton })),
)

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface DocumentQuizDisplayProps {
  questions: Question[]
  onSave?: (questions: Question[]) => void
  onUpdate?: (questions: Question[]) => void
  title?: string
  isEditable?: boolean
  isOwner?: boolean
}

const QuestionEditor = ({
  question,
  index,
  onUpdate,
  onDelete,
  isEditing,
  onToggleEdit,
}: {
  question: Question
  index: number
  onUpdate: (question: Question) => void
  onDelete: () => void
  isEditing: boolean
  onToggleEdit: () => void
}) => {
  const [editedQuestion, setEditedQuestion] = useState(question)

  const handleSave = useCallback(() => {
    // Validate question
    if (!editedQuestion.question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question before saving.",
        variant: "destructive",
      })
      return
    }

    if (editedQuestion.options.some((opt) => !opt.trim())) {
      toast({
        title: "All options required",
        description: "Please fill in all answer options.",
        variant: "destructive",
      })
      return
    }

    onUpdate(editedQuestion)
    onToggleEdit()
    toast({
      title: "Question updated",
      description: "Your changes have been saved.",
    })
  }, [editedQuestion, onUpdate, onToggleEdit])

  const handleCancel = useCallback(() => {
    setEditedQuestion(question)
    onToggleEdit()
  }, [question, onToggleEdit])

  const updateOption = useCallback((optionIndex: number, value: string) => {
    setEditedQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === optionIndex ? value : opt)),
    }))
  }, [])

  const addOption = useCallback(() => {
    if (editedQuestion.options.length >= 6) {
      toast({
        title: "Maximum options reached",
        description: "You can have up to 6 answer options.",
        variant: "destructive",
      })
      return
    }
    setEditedQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }, [editedQuestion.options.length])

  const removeOption = useCallback(
    (optionIndex: number) => {
      if (editedQuestion.options.length <= 2) {
        toast({
          title: "Minimum options required",
          description: "You need at least 2 answer options.",
          variant: "destructive",
        })
        return
      }
      setEditedQuestion((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== optionIndex),
        correctAnswer:
          prev.correctAnswer >= optionIndex && prev.correctAnswer > 0 ? prev.correctAnswer - 1 : prev.correctAnswer,
      }))
    },
    [editedQuestion.options.length],
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`transition-all duration-200 ${isEditing ? "ring-2 ring-primary/50 shadow-lg" : "hover:shadow-md"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-bold">
                {index + 1}
              </span>
              Question {index + 1}
            </CardTitle>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSave}
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save changes</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancel editing</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onToggleEdit}
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit question</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onDelete}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete question</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Question</label>
                <Textarea
                  value={editedQuestion.question}
                  onChange={(e) => setEditedQuestion((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter your question..."
                  className="min-h-[60px] sm:min-h-[80px] resize-none text-sm sm:text-base"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Answer Options</label>
                  <Button variant="outline" size="sm" onClick={addOption} disabled={editedQuestion.options.length >= 6}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {editedQuestion.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-medium shrink-0">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(optionIndex, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        className="flex-1"
                      />
                      {editedQuestion.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(optionIndex)}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Correct Answer</label>
                  <Select
                    value={editedQuestion.correctAnswer.toString()}
                    onValueChange={(value) =>
                      setEditedQuestion((prev) => ({ ...prev, correctAnswer: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {editedQuestion.options.map((option, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {String.fromCharCode(65 + index)}. {option || `Option ${String.fromCharCode(65 + index)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-base leading-relaxed">{question.question}</p>
              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      optionIndex === question.correctAnswer
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-sm font-medium">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {optionIndex === question.correctAnswer && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
export default function DocumentQuizDisplay({
  questions,
  onSave,
  onUpdate,
  title = "Generated Quiz",
  isEditable = true,
  isOwner = false,
}: DocumentQuizDisplayProps) {

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [localQuestions, setLocalQuestions] = useState(questions)

  // Memoize expensive calculations
  const validQuestions = useMemo(
    () => localQuestions.filter((q) => q.question.trim() && q.options.every((opt) => opt.trim())),
    [localQuestions],
  )

  const handleUpdateQuestion = useCallback(
    (updatedQuestion: Question) => {
      const newQuestions = localQuestions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
      setLocalQuestions(newQuestions)
      onUpdate?.(newQuestions)
    },
    [localQuestions, onUpdate],
  )

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      if (localQuestions.length <= 1) {
        toast({
          title: "Cannot delete",
          description: "You need at least one question in your quiz.",
          variant: "destructive",
        })
        return
      }

      const newQuestions = localQuestions.filter((q) => q.id !== questionId)
      setLocalQuestions(newQuestions)
      onUpdate?.(newQuestions)
      toast({
        title: "Question deleted",
        description: "The question has been removed from your quiz.",
      })
    },
    [localQuestions, onUpdate],
  )

  const handleAddQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      question: "",
      options: ["", ""],
      correctAnswer: 0,
    }
    const newQuestions = [...localQuestions, newQuestion]
    setLocalQuestions(newQuestions)
    onUpdate?.(newQuestions)
    setEditingQuestionId(newQuestion.id)
    toast({
      title: "Question added",
      description: "A new question has been added to your quiz.",
    })
  }, [localQuestions, onUpdate])

  const toggleEdit = useCallback((questionId: string) => {
    setEditingQuestionId((prev) => (prev === questionId ? null : questionId))
  }, [])

  if (!localQuestions.length) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
          <p className="text-muted-foreground mb-4">Upload a document and generate questions, or add them manually.</p>
          {isEditable && (
            <Button onClick={handleAddQuestion} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Question Manually
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {validQuestions.length} of {localQuestions.length} questions complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add a new question to your quiz</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Suspense
            fallback={
              <Button variant="outline" size="sm" disabled className="flex items-center gap-2">
                <InlineLoader size="xs" variant="spinner" />
                <span>Preparing PDF...</span>
              </Button>
            }
          >
            <EnhancedPDFDownloadButton
              questions={validQuestions}
              title={title}
              variant="outline"
              size="sm"
              isOwner={isOwner}
            />
          </Suspense>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {localQuestions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            onUpdate={handleUpdateQuestion}
            onDelete={() => handleDeleteQuestion(question.id)}
            isEditing={editingQuestionId === question.id}
            onToggleEdit={() => toggleEdit(question.id)}
          />
        ))}
      </AnimatePresence>

      {validQuestions.length > 0 && onSave && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => onSave(validQuestions)} size="lg" className="min-w-[180px] sm:min-w-[200px] min-h-[44px]">
            <Save className="mr-2 h-5 w-5" />
            Save Quiz ({validQuestions.length} questions)
          </Button>
        </div>
      )}
    </div>
  )
}
