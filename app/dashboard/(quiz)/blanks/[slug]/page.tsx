"use client"

import { use } from "react"
import { useAuth } from "@/hooks/useAuth"
import { InitializingDisplay } from "../../components/QuizStateDisplay"
import BlankQuizWrapper from "../components/BlanksQuizWrapper"


export default function BlanksPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const { isAuthenticated,user} = useAuth()
  
  // Extract slug for both test and production environments
  const slug = params instanceof Promise ? use(params).slug : params.slug

  // If still loading auth status, show loading
  if (status === "loading") {
    return <InitializingDisplay />
  }

  return (
    <div className="container max-w-4xl py-6">
      <BlankQuizWrapper slug={slug} userId={user?.id} />
    </div>
  )
}
