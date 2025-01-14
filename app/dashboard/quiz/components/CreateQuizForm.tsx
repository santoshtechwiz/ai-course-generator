"use client"

import * as React from "react"
import { Brain, Lightbulb, Lock, HelpCircle, Timer, User, Save } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ConfirmDialog } from "./ConfirmDialog"
import { quizSchema } from "@/schema/schema"

import { signIn, useSession } from 'next-auth/react'
import { usePersistentState } from "@/hooks/usePersistentState"
import { motion } from "framer-motion"
import { SignInBanner } from "./SignInBanner"

type QuizFormData = z.infer<typeof quizSchema>

interface Props {
  isLoggedIn: boolean,
 
}

export default function CreateQuizForm({ isLoggedIn}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()

  const isDisabled= session?.user.credits<1;

  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    topic: "",
    amount: 5,
    difficulty: "medium",
  })
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: formData,
  })
  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await axios.post("/api/game", data)
      return response.data
    },
    onError: (error) => {
      console.error("Error creating quiz:", error)
      toast({
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      })
    }
  })

  const onSubmit = React.useCallback((data: QuizFormData) => {
    if (isLoading) return

    if (!isLoggedIn) {
      signIn('credentials', { callbackUrl: '/dashboard/quiz' })
      return
    }

    setIsConfirmDialogOpen(true)
  }, [isLoading, isLoggedIn])

  const handleConfirm = React.useCallback(async () => {
    setIsConfirmDialogOpen(false)
    setIsLoading(true)

    try {
      const response = await createQuizMutation.mutateAsync(watch())
      const gameId = response?.gameId

      if (!gameId) throw new Error("Game ID not found")

      toast({
        title: "Success!",
        description: "Your quiz has been created.",
      })

      router.push(`/dashboard/mcq/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createQuizMutation, watch, toast, router])

  const amount = watch("amount")
  const difficulty = watch("difficulty")

  return (
    <Card className="mx-auto max-w-2xl">
      <SignInBanner isAuthenticated={status === 'authenticated'} />
      <CardHeader>
        <div className="flex justify-center mb-4">
          <motion.div 
            className="p-3 bg-primary/10 rounded-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
        <CardTitle className="text-center text-3xl font-bold">
          Create Your Quiz
        </CardTitle>
        <CardDescription className="text-center text-lg">
          Customize your quiz settings and challenge yourself!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="topic" className="text-lg font-medium">
              Topic
            </Label>
            <div className="relative">
              <Input
                id="topic"
                placeholder="Enter the quiz topic"
                className="h-12 pr-10"
                {...register("topic")}
                aria-describedby="topic-description"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="absolute right-3 top-3 w-6 h-6 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter any topic you'd like to be quizzed on</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {errors.topic && (
              <p className="text-sm text-destructive" id="topic-error">{errors.topic.message}</p>
            )}
            <p className="text-sm text-muted-foreground" id="topic-description">Choose a specific topic for more focused questions</p>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium">Number of Questions</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Timer className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-primary">{amount}</span>
              </div>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <Slider
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    max={15}
                    min={1}
                    step={1}
                    className="py-4"
                    aria-label="Number of questions"
                  />
                )}
              />
              <p className="text-sm text-muted-foreground text-center">
                Select between 1 and 15 questions
              </p>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {isLoggedIn ? "Unlimited quizzes available" : `This quiz will use ${amount} credit${amount > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium">Difficulty</Label>
            <div className="grid grid-cols-3 gap-4">
              {["easy", "medium", "hard"].map((level) => (
                <TooltipProvider key={level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={difficulty === level ? "default" : "outline"}
                        className={cn(
                          "capitalize",
                          difficulty === level && "border-primary"
                        )}
                        onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                        aria-pressed={difficulty === level}
                      >
                        {level}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{level.charAt(0).toUpperCase() + level.slice(1)} difficulty questions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <motion.div
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isDisabled || isLoading}
                className="w-full"
              >
                {isLoading ? "Creating..." : (isLoggedIn ? "Create Quiz" : "Sign In to Create")}
              </Button>
            </motion.div>
            {status !== 'authenticated' && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Quiz Saved",
                      description: "Your quiz has been saved as a draft. Sign in to complete it later.",
                    })
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </motion.div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t pt-6">
        {/* Removed credits-related UI elements */}
      </CardFooter>
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </Card>
  )
}

