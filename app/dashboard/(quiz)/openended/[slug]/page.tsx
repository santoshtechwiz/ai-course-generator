"use client"

import { use } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Spinner } from "@/hooks/spinner"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"


export default function OpenEndedPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Extract slug for both test and production environments
  const slug = params instanceof Promise ? use(params).slug : params.slug
  
  // Custom hook for auth status
  const { isAuthenticated } = useAuth()

  // If still loading auth status, show loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <OpenEndedQuizWrapper slug={slug} />
    </div>
  )
}
