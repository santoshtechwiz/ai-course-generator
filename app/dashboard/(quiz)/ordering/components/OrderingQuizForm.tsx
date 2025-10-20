'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { useToast } from '@/hooks'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, HelpCircle, Sparkles, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import PlanAwareButton from '@/components/quiz/PlanAwareButton'
import { SubscriptionSlider } from '@/app/dashboard/subscription/components/SubscriptionSlider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SubscriptionPlanType } from '@/types/subscription-plans'
import { getPlanConfig } from '@/types/subscription-plans'

interface OrderingQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxSteps: number
  quizType: string
  params?: Record<string, string>
}

export default function OrderingQuizForm({
  credits,
  isLoggedIn,
  maxSteps,
  quizType,
  params,
}: OrderingQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { subscription, plan } = useUnifiedSubscription()
  const userPlan = (plan || 'FREE') as SubscriptionPlanType
  const planConfig = getPlanConfig(userPlan)

  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Get subscription-based limits
  const minSteps = useMemo(() => 2, [])
  const maxStepsAllowed = useMemo(() => {
    const configMax = typeof planConfig.maxQuestionsPerQuiz === 'number' ? planConfig.maxQuestionsPerQuiz : 20
    return Math.min(maxSteps || configMax, 20)
  }, [maxSteps, planConfig.maxQuestionsPerQuiz])

  // Create dynamic schema based on subscription limits
  const orderingSchema = useMemo(
    () =>
      z.object({
        topic: z.string().min(3, 'Topic must be at least 3 characters'),
        numberOfSteps: z.number().min(minSteps).max(maxStepsAllowed),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      }),
    [minSteps, maxStepsAllowed]
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
      numberOfSteps: params?.numberOfSteps ? Math.min(Number(params.numberOfSteps), maxStepsAllowed) : Math.floor((minSteps + maxStepsAllowed) / 2),
      difficulty: (params?.difficulty as any) || 'medium',
    },
    mode: 'onChange',
  })

  const watchDifficulty = watch('difficulty')
  const watchNumberOfSteps = watch('numberOfSteps')

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

  const onSubmit = useCallback(
    async (data: OrderingFormData) => {
      setSubmissionError(null)
      try {
        await generateQuiz(data)
      } catch (error) {
        console.error('Error:', error)
      }
    },
    [generateQuiz]
  )

  const isFormValid = isValid && !!watch('topic')
  const isDisabled = credits < 1 || !isFormValid || isGenerating || !isLoggedIn

  return (
    <div className="w-full max-w-4xl mx-auto">
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
                className="w-full h-12 text-base bg-background border-border focus:border-primary focus:ring-primary/20"
                {...register('topic')}
                aria-describedby="topic-description"
                disabled={isGenerating}
              />
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

        {/* Number of Steps */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
            Number of Steps
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Select how many steps you want in your ordering quiz (up to {maxStepsAllowed} based on your {userPlan} plan)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Timer className="w-6 h-6 text-muted-foreground" />
              <motion.span
                className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums"
                key={watchNumberOfSteps}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                {watchNumberOfSteps}
              </motion.span>
            </div>

            <Controller
              name="numberOfSteps"
              control={control}
              render={({ field }) => (
                <SubscriptionSlider
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  ariaLabel="Select number of steps"
                />
              )}
            />

            <p className="text-sm text-muted-foreground text-center">
              Select between {minSteps} and {maxStepsAllowed} steps
            </p>
          </div>

          {errors.numberOfSteps && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.numberOfSteps.message}</p>
          )}

          <p className="text-sm text-muted-foreground">
            {isLoggedIn ? `Maximum ${maxStepsAllowed} steps available for ${userPlan} plan` : `This quiz will use ${watchNumberOfSteps} credit${watchNumberOfSteps > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
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

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {['easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setValue('difficulty', diff as any)}
                className={cn(
                  'p-3 md:p-4 rounded-lg border-2 font-semibold text-sm md:text-base transition-all duration-200',
                  watchDifficulty === diff
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                disabled={isGenerating}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plan Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{userPlan}</strong> plan: Maximum {maxStepsAllowed} steps per ordering quiz
            </AlertDescription>
          </Alert>
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
            className="w-full"
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
    </div>
  )
}

