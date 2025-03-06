"use client"

import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { BookOpen, Lightbulb } from "lucide-react"

// Add this import for handling query parameters
import { useSearchParams } from "next/navigation"

const ClientPage = () => {
  // Use the useSearchParams hook to get query parameters
  const searchParams = useSearchParams()

  // Extract 'topic' and 'amount' from query parameters
  const topic = searchParams.get("topic") || ""
  const amount = searchParams.get("amount") || "5" // Default to 5 if not provided
  console.log(topic, amount)
  return (
    <div className="container mx-auto py-6 space-y-6">
      <RandomQuote />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center text-foreground">
                <BookOpen className="mr-2 h-6 w-6 text-primary" />
                Create a New Quiz
              </h2>
              <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                Pro tip: Be specific with your topic
              </div>
            </div>
            <QuizWrapper
              type="mcq"
              queryParams={{
                topic: topic,
                amount: amount,
              }}
            />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border/50">
            <AnimatedQuizHighlight />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPage

