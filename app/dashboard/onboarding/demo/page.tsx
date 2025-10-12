"use client"

import OnboardingWizard from "@/components/onboarding/OnboardingWizard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function OnboardingDemoPage() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(true)

  const handleComplete = (data: any) => {
    console.log("Onboarding complete!", data)
    setShowWizard(false)
  }

  const handleDismiss = () => {
    console.log("Onboarding dismissed")
    setShowWizard(false)
  }

  if (showWizard) {
    return <OnboardingWizard onComplete={handleComplete} onDismiss={handleDismiss} />
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>✅ Onboarding Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thanks for completing the onboarding wizard! Your preferences have been saved.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setShowWizard(true)}>
              Restart Onboarding
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
