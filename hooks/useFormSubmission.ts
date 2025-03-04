"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { signIn } from "next-auth/react"

interface UseFormSubmissionOptions<T> {
  endpoint: string
  onSuccess?: (data: any) => void
  redirectPath?: string
  successMessage?: string
  errorMessage?: string
  requiresAuth?: boolean
  requiresCredits?: boolean
  credits?: number
}

export function useFormSubmission<T>({
  endpoint,
  onSuccess,
  redirectPath,
  successMessage = "Success!",
  errorMessage = "Something went wrong. Please try again.",
  requiresAuth = true,
  requiresCredits = true,
  credits = 0,
}: UseFormSubmissionOptions<T>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (data: T) => {
      if (isLoading) return

      if (requiresAuth && !isLoading) {
        signIn("credentials", { callbackUrl: window.location.href })
        return
      }

      if (requiresCredits && credits < 1) {
        toast({
          title: "No Credits Available",
          description: "You don't have enough credits. Please subscribe or buy more credits.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const responseData = await response.json()

        toast({
          title: successMessage,
          description: "Your request was processed successfully.",
        })

        if (onSuccess) {
          onSuccess(responseData)
        }

        if (redirectPath) {
          const path = responseData.slug ? `${redirectPath}/${responseData.slug}` : redirectPath
          router.push(path)
        }
      } catch (err) {
        console.error("Error submitting form:", err)
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [
      isLoading,
      requiresAuth,
      requiresCredits,
      credits,
      endpoint,
      toast,
      successMessage,
      errorMessage,
      onSuccess,
      redirectPath,
      router,
    ],
  )

  return {
    isLoading,
    error,
    handleSubmit,
  }
}

