"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface SignInPromptProps {
  callbackUrl: string
}

export default function SignInPrompt({ callbackUrl }: SignInPromptProps) {
  if (!callbackUrl) {
    return <div>Error: Missing callback URL.</div>
  }

  return (
    <div>
      <p>Please sign in to view your quiz results.</p>
      <Button onClick={() => signIn("credentials", { callbackUrl })}>Sign In</Button>
    </div>
  )
}
