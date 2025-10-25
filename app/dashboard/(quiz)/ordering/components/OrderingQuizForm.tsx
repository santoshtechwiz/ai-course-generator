'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { useToast } from '@/hooks'
import { useContextualAuth } from '@/components/auth/ContextualAuthPrompt'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, HelpCircle, Lightbulb, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import PlanAwareButton from '@/components/quiz/PlanAwareButton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SubscriptionSlider } from '../../../subscription/components/SubscriptionSlider'
import type { SubscriptionPlanType } from '@/types/subscription-plans'
import { getPlanConfig } from '@/types/subscription-plans'

interface OrderingQuizFormProps {
  credits: number
  isLoggedIn: boolean
  quizType: string
  params?: Record<string, string>
}

export default function OrderingQuizForm({
  credits,
  isLoggedIn,
  quizType,
  params,
}: OrderingQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { subscription, plan } = useUnifiedSubscription()
  const userPlan = (plan || 'FREE') as SubscriptionPlanType
  const planConfig = getPlanConfig(userPlan)
  const { requireAuth } = useContextualAuth()

  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // Hard limit of 5 questions for ordering quizzes
  const maxQuestions = Math.min(5, planConfig.maxQuestionsPerQuiz === 'unlimited' ? 5 : planConfig.maxQuestionsPerQuiz)

  // Create dynamic schema based on subscription limits
  const orderingSchema = useMemo(
    () =>
      z.object({
        topic: z.string().min(3, 'Topic must be at least 3 characters'),
        numberOfQuestions: z.number().min(1).max(maxQuestions),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      }),
    [maxQuestions]
  )

  type OrderingFormData = z.infer<typeof orderingSchema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    control,
  } = useForm<OrderingFormData>({
    resolver: zodResolver(orderingSchema),
    defaultValues: {
      topic: typeof params?.topic === 'string' ? params.topic : '',
      numberOfQuestions: 5,
      difficulty: (params?.difficulty as any) || 'medium',
    },
    mode: 'onChange',
  })

  const watchDifficulty = watch('difficulty')

  const { mutateAsync: generateQuiz, isPending: isGenerating } = useMutation({
    mutationFn: async (data: OrderingFormData) => {
      if (!isLoggedIn) {
        throw new Error('Please log in to generate quizzes')
      }

      const response = await fetch('/api/ordering-quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quizType: 'ordering',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate quiz')
      }

      return response.json()
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to generate ordering quiz'
      setSubmissionError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
      setIsSuccess(true)
      toast({
        title: 'Success',
        description: 'Quiz generated successfully!',
      })
      if (data.slug) {
        setTimeout(() => {
          router.push(`/dashboard/ordering/${data.slug}`)
        }, 500)
      }
    },
  })

  // Validation function
  const validateQuizData = (data: OrderingFormData): string | null => {
    if (!data.topic || data.topic.length < 3) {
      return 'Topic must be at least 3 characters long'
    }
    if (!data.numberOfQuestions || data.numberOfQuestions < 1 || data.numberOfQuestions > maxQuestions) {
      return `Number of questions must be between 1 and ${maxQuestions}`
    }
    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
      return 'Please select a valid difficulty level'
    }
    return null
  }

  const onSubmit = useCallback(
    (data: OrderingFormData) => {
      const error = validateQuizData(data)
      if (error) {
        toast({
          title: 'Validation Error',
          description: error,
          variant: 'destructive',
        })
        return
      }

      if (!isLoggedIn) {
        requireAuth('create_quiz', `${data.numberOfQuestions} ordering questions on "${data.topic}"`)
        return
      }

      setIsConfirmDialogOpen(true)
    },
    [isLoggedIn, requireAuth, toast, maxQuestions]
  )

  const handleConfirm = useCallback(async () => {
    setSubmissionError(null)
    try {
      const data = await generateQuiz(watch())
      setIsSuccess(true)
      if (data.slug) {
        router.push(`/dashboard/ordering/${data.slug}`)
      }
    } catch (error: any) {
      setSubmissionError(error.message || 'Failed to generate quiz')
    } finally {
      setIsConfirmDialogOpen(false)
    }
  }, [generateQuiz, watch, router])

  const isFormValid = isValid && !!watch('topic')
  const isDisabled = credits < 1 || !isFormValid || isGenerating || !isLoggedIn

  return (
    <div className="w-full max-w-4xl mx-auto neuro-strong-typography">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
        {/* Topic Selection */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="topic" className="text-base md:text-lg font-semibold text-foreground">
              Topic
            </Label>
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs md:text-sm">
                  <p>Enter any topic you'd like to create an ordering quiz on. Examples: "HTTP request lifecycle", "Git workflow steps"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="relative">
              <Input
                id="topic"
                placeholder="Enter the quiz topic (e.g., 'HTTP request lifecycle', 'deployment process')"
                className="w-full h-12 text-base bg-background border-border focus:border-primary focus:ring-primary/20 pr-12"
                {...register('topic')}
                aria-describedby="topic-description"
                disabled={isGenerating}
              />
              <Lightbulb className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {errors.topic && (
              <p className="text-sm text-red-600 dark:text-red-400" id="topic-error">
                {errors.topic.message}
              </p>
            )}

            <p className="text-sm text-muted-foreground" id="topic-description">
              Be specific for more focused ordering steps. Multi-word topics work great!
            </p>
          </div>
        </motion.div>

        {/* Number of Questions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
            Number of Questions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Choose how many ordering questions to generate. Each question will have its own set of steps to arrange.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="space-y-3">
            <Controller
              name="numberOfQuestions"
              control={control}
              render={({ field }) => (
                <SubscriptionSlider
                  value={field.value}
                  onValueChange={field.onChange}
                  ariaLabel="Number of ordering questions"
                />
              )}
            />

            {errors.numberOfQuestions && (
              <p className="text-sm text-red-600 dark:text-red-400 px-3">
                {errors.numberOfQuestions.message}
              </p>
            )}
          </div>
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label className="text-lg font-black text-foreground flex items-center gap-2">
            Difficulty Level
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Choose difficulty: Easy for fundamentals, Medium for standard knowledge, Hard for advanced concepts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: 'easy', label: 'Easy', icon: '🟢' },
              { value: 'medium', label: 'Medium', icon: '🟡' },
              { value: 'hard', label: 'Hard', icon: '🔴' },
            ].map((level) => (
              <Button
                key={level.value}
                type="button"
                variant={watchDifficulty === level.value ? "default" : "outline"}
                className={cn(
                  "capitalize w-full h-14 font-black transition-all duration-200 text-base border-4",
                  watchDifficulty === level.value
                    ? level.value === "easy"
                      ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                      : level.value === "medium"
                        ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                        : "bg-[var(--color-error)]/20 text-[var(--color-error)] border-[var(--color-error)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                    : "bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-muted)] shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]",
                )}
                onClick={() => setValue('difficulty', level.value as any)}
                aria-pressed={watchDifficulty === level.value}
                disabled={isGenerating}
              >
                <span className="mr-2">{level.icon}</span>
                {level.label}
                {watchDifficulty === level.value && <Check className="ml-2 h-5 w-5 text-[var(--color-text)]" />}
              </Button>
            ))}
          </div>

          {watchDifficulty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-4 border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4 text-sm rounded-xl"
            >
              <p className="font-black text-[var(--color-foreground)]">
                {watchDifficulty === "easy" && "Easy Ordering:"}
                {watchDifficulty === "medium" && "Medium Ordering:"}
                {watchDifficulty === "hard" && "Hard Ordering:"}
              </p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-2">
                {watchDifficulty === "easy" && "Basic sequences, simple processes. Examples: Days of the week, basic math operations. 2-3 steps per question."}
                {watchDifficulty === "medium" && "Standard workflows, common procedures. Examples: Software development cycle, cooking recipes. 4-6 steps per question."}
                {watchDifficulty === "hard" && "Complex processes, technical workflows. Examples: Database query execution, network protocols. 6-8 steps per question."}
              </p>
            </motion.div>
          )}

          {errors.difficulty && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.difficulty.message}
            </p>
          )}
        </motion.div>

        {/* Plan Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
         
        </motion.div>

        {/* Error Message */}
        {submissionError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Submit Button with PlanAwareButton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
          <PlanAwareButton
            type="submit"
            label={
              isGenerating ? 'Generating...' : 'Generate Quiz'
            }
            onClick={handleSubmit(onSubmit)}
            isLoggedIn={isLoggedIn}
            isLoading={isGenerating}
            isEnabled={isFormValid}
            hasCredits={credits > 0}
            creditsRequired={1}
            className="w-full h-14 text-lg font-black transition-all duration-300 bg-[var(--color-primary)] text-[var(--color-bg)] border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:bg-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            showIcon={true}
            loadingLabel="Generating..."
            requiredPlan="FREE"
            currentPlan={userPlan}
            customStates={{
              default: {
                label: 'Generate Quiz',
              },
              notLoggedIn: {
                label: 'Sign In to Create Quiz',
                tooltip: 'You need to be logged in to create ordering quizzes',
              },
              noCredits: {
                label: 'Insufficient Credits',
                tooltip: 'Please upgrade your plan or purchase credits',
              },
            }}
          />
          </motion.div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
        title="Generate Ordering Quiz?"
        description={`Generate ${watch('numberOfQuestions')} ordering questions on "${watch('topic')}"?`}
        confirmText={isGenerating ? 'Generating...' : 'Generate Quiz'}
        cancelText="Cancel"
        quizInfo={{
          type: 'Ordering',
          topic: watch('topic'),
          count: watch('numberOfQuestions'),
          difficulty: watch('difficulty'),
          estimatedCredits: 1,
        }}
        status={isGenerating ? 'loading' : isSuccess ? 'success' : submissionError ? 'error' : undefined}
        errorMessage={submissionError || undefined}
      />
    </div>
  )
}

