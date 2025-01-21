"use client"

import React, { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"


interface QuizSubmissionProps {
  slug: string
  answers: string[]
}

export function QuizSubmission({ slug, answers }: QuizSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await axios.post(`/api/quiz/${slug}/complete`, { answers })

      if (response.data.success) {
        toast({
          title: "Quiz Submitted",
          description: "Your answers have been successfully submitted.",
          variant: "default",
        })
        // Redirect to results page or update UI as needed
        router.push(`/quiz/${slug}/results`)
      } else {
        throw new Error(response.data.error || "Failed to submit quiz")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-6">
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Quiz"}
      </Button>
    </div>
  )
}

