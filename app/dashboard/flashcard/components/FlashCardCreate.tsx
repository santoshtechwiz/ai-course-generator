"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Book, Clock, Sparkles, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { toast } from "@/hooks/use-toast"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"
import type { QueryParams } from "@/app/types/types"

interface FlashCreationFormProps {
  maxQuestions?: number
  params?: QueryParams
}

const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Topic must be at least 3 characters" })
    .max(100, { message: "Topic must be less than 100 characters" }),
  amount: z
    .number()
    .min(1, { message: "You must create at least 1 flashcard" })
    .max(20, { message: "You can create up to 20 flashcards at once" }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Please select a difficulty level",
  }),
})

const EXAMPLE_TOPICS = [
  "JavaScript Promises and Async/Await",
  "React Hooks and State Management",
  "Python Data Structures",
  "Machine Learning Fundamentals",
  "SQL Joins and Queries",
  "World War II Major Battles",
  "Human Anatomy: The Nervous System",
  "Photosynthesis Process",
]

const FlashCardCreate: React.FC<FlashCreationFormProps> = ({ maxQuestions = 20, params }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exampleTopic, setExampleTopic] = useState("")
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const { subscriptionStatus } = useSubscriptionStore()

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_TOPICS.length)
    setExampleTopic(EXAMPLE_TOPICS[randomIndex])
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: params?.title || "",
      amount: 5,
      difficulty: "medium",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to create flashcards")
      }

      const data = await response.json()

      toast({
        title: "Flashcards created!",
        description: `Created ${values.amount} ${values.difficulty} flashcards about "${values.title}"`,
      })

      router.push(`/dashboard/flashcard/${data.data.slug}`)
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Failed to create flashcards. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isTopicValid = form.watch("title").length >= 3
  const difficulty = form.watch("difficulty")
  const amount = form.watch("amount")

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (formRef.current) {
      await form.trigger()
      if (form.formState.isValid) {
        form.handleSubmit(onSubmit)()
      }
    }
  }

  const handleExampleClick = () => {
    form.setValue("title", exampleTopic)
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getEstimatedTime = () => {
    const baseTime = 5
    const difficultyMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : 1
    const cardMultiplier = amount * 0.5
    return Math.round(baseTime + cardMultiplier * difficultyMultiplier)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
     

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>New Flashcard Set</span>
          </h2>
          {/* <div className="flex gap-2">
            <Badge variant="outline" className="font-normal">
              <Clock className="mr-1 h-3 w-3" />~{getEstimatedTime()} min
            </Badge>
            <Badge className={`font-normal ${getDifficultyColor(difficulty)}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          </div> */}
        </div>

        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder={`e.g. ${exampleTopic}`} className="bg-background" {...field} />
                    </div>
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription>What would you like to learn about?</FormDescription>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={handleExampleClick}
                    >
                      Use example
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Basic concepts and definitions</SelectItem>
                      <SelectItem value="medium">Medium - Moderate complexity and application</SelectItem>
                      <SelectItem value="hard">Hard - Advanced concepts and analysis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Determines the complexity of questions and answers</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Flashcards: {field.value}</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <SubscriptionSlider
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                    
                        step={1}
                      />
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Fewer</span>
                    <span>More</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />

            <PlanAwareButton
              onClick={handleButtonClick}
              isLoading={isSubmitting}
              hasCredits={(subscriptionStatus?.credits ?? 0) > 0}
              isEnabled={isTopicValid}
              label="Create Flashcards"
              loadingLabel={isSubmitting ? "Generating flashcards..." : "Create Flashcards"}
              className="w-full"
              customStates={{
                default: {
                  label: "Create Flashcards",
                  tooltip: "Click to generate your flashcards",
                },
                notEnabled: {
                  label: "Enter a topic to generate",
                  tooltip: "Please enter a topic before generating the flashcards",
                },
                noCredits: {
                  label: "Out of credits",
                  tooltip: "You need credits to generate flashcards. Consider upgrading your plan.",
                },
              }}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}

export default FlashCardCreate

