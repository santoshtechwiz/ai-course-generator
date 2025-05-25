"use client"

import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizLoadingStepsProps {
  steps: { label: string; status: "pending" | "loading" | "done" | "error"; errorMsg?: string }[]
  className?: string
}

export function QuizLoadingSteps({ steps, className }: QuizLoadingStepsProps) {
  // Determine overall status for icon
  const hasError = steps.some((s) => s.status === "error")
  const isLoading = steps.some((s) => s.status === "loading")
  const isDone = steps.every((s) => s.status === "done")

  let Icon = Loader2
  let iconClass = "text-primary animate-spin"
  let iconLabel = "Loading"
  if (hasError) {
    Icon = AlertTriangle
    iconClass = "text-destructive"
    iconLabel = "Error"
  } else if (isDone) {
    Icon = CheckCircle2
    iconClass = "text-green-500"
    iconLabel = "Done"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[60vh] w-full", className)}>
      <div className="flex flex-col items-center justify-center bg-background border shadow-lg rounded-xl px-8 py-10 max-w-md w-full">
        <div className="mb-4 flex flex-col items-center">
          <Icon className={cn("w-10 h-10 mb-2", iconClass)} aria-label={iconLabel} />
          <h2 className="text-lg font-bold mb-1">Loading Quiz...</h2>
        </div>
        <ol className="space-y-3 w-full">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-1">
                {step.status === "done" && (
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                )}
                {step.status === "loading" && (
                  <Loader2 className="animate-spin text-primary w-5 h-5" />
                )}
                {step.status === "pending" && (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                )}
                {step.status === "error" && (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <span className={cn("font-medium", step.status === "error" && "text-destructive")}>
                  {step.label}
                </span>
                {step.status === "error" && step.errorMsg && (
                  <div className="text-xs text-destructive mt-1">{step.errorMsg}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
