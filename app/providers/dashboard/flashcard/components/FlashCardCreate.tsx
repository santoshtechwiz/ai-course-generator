"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Book, Lightbulb, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "@/hooks/use-toast"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"
import { QueryParams } from "@/app/types/types"
interface FlashCreationFormProps {
  maxQuestions: number
  params: QueryParams
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

// export default function FlashCardCreate() {
const FlashCardCreate: React.FC<FlashCreationFormProps> = ({  maxQuestions}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const { subscriptionStatus } = useSubscriptionStore()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: 3,
      difficulty: "medium",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // In a real app, you would send this data to your API
      const response = await fetch("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to create flashcards")
      }

      const data = await response.json()
      console.log(data);

      toast({
        title: "Flashcards created!",
        description: `Created ${values.amount} ${values.difficulty} flashcards about "${values.title}"`,
      })

      // Redirect to the flashcards page
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

  // This function will be called by the PlanAwareButton
  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Manually trigger form validation and submission
    if (formRef.current) {
      await form.trigger() // Trigger validation

      if (form.formState.isValid) {
        // If form is valid, submit it programmatically
        form.handleSubmit(onSubmit)()
      }
    }
  }

  return (
    <div className="container max-w-3xl py-10 px-4">
      <div className="mb-8">
        <Link href="/dashboard/flashcard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flashcards
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Flashcards</h1>
        <p className="text-muted-foreground mt-2">Generate AI-powered flashcards to help you study any topic</p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            New Flashcard Set
          </CardTitle>
          <CardDescription>Enter a topic and choose how many flashcards you want to create</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                title="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Book className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. JavaScript Promises, World War II, Photosynthesis"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Be specific for better results</FormDescription>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
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
                        <SubscriptionSlider value={field.value} onValueChange={(val) => field.onChange(val)} />
                       
                      </div>
                    </FormControl>
                    <FormDescription>More cards will take longer to generate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <PlanAwareButton
                  onClick={handleButtonClick}
                  isLoading={isSubmitting}
                  hasCredits={(subscriptionStatus?.credits ?? 0) > 0}
                  isEnabled={isTopicValid}
                  label="Create Flashcards"
                  loadingLabel={isSubmitting ? "Generating flashcards..." : "Create Flashcards"}
                  className="w-full transition-all duration-300"
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
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-muted/50 px-6 py-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Lightbulb className="mr-2 h-4 w-4" />
            <span>Tip: For best results, use specific topics rather than broad subjects</span>
          </div>
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="text-sm text-destructive">Please fix the errors above before submitting</div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export default FlashCardCreate;