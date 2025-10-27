"use client"

import React from "react"
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCcw, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  message?: string
  estimatedTime?: string
  startedAt?: Date
}

interface ProgressStepperProps {
  steps: ProgressStep[]
  onRetry?: (stepId: string) => void
  onCancel?: (stepId: string) => void
  showControls?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  title?: string
  subtitle?: string
}

export function ProgressStepper({
  steps,
  onRetry,
  onCancel,
  showControls = true,
  size = "md",
  className,
  title,
  subtitle,
}: ProgressStepperProps) {
  const sizeConfig = {
    sm: {
      iconSize: "h-3 w-3",
      progressHeight: "h-1.5",
      textSize: "text-xs",
      buttonSize: "h-7 px-2 text-xs",
      padding: "p-2",
      spacing: "space-y-1.5",
    },
    md: {
      iconSize: "h-4 w-4",
      progressHeight: "h-2",
      textSize: "text-sm",
      buttonSize: "h-8 px-3 text-xs",
      padding: "p-3",
      spacing: "space-y-2",
    },
    lg: {
      iconSize: "h-5 w-5",
      progressHeight: "h-3",
      textSize: "text-base",
      buttonSize: "h-9 px-4 text-sm",
      padding: "p-4",
      spacing: "space-y-3",
    },
  }

  const { iconSize, progressHeight, textSize, buttonSize, padding, spacing } = sizeConfig[size]

  const getStepIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case "pending":
        return <Clock className={cn(iconSize, "text-muted-foreground")} />
      case "processing":
        return <Loader2 className={cn(iconSize, "text-primary animate-spin")} />
      case "completed":
        return <CheckCircle className={cn(iconSize, "text-success")} />
      case "error":
        return <XCircle className={cn(iconSize, "text-danger")} />
      default:
        return <AlertCircle className={cn(iconSize, "text-muted-foreground")} />
    }
  }

  const getStepColor = (status: ProgressStep['status']) => {
    switch (status) {
      case "pending":
        return "border-muted-foreground/20"
      case "processing":
        return "border-primary"
      case "completed":
        return "border-success"
      case "error":
        return "border-danger"
      default:
        return "border-border"
    }
  }

  const getProgressColor = (status: ProgressStep['status']) => {
    switch (status) {
      case "processing":
        return "bg-primary"
      case "completed":
        return "bg-success"
      case "error":
        return "bg-danger"
      default:
        return "bg-muted"
    }
  }

  const getOverallProgress = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length
    const totalSteps = steps.length
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  }

  const getCurrentStepMessage = () => {
    const processingStep = steps.find(step => step.status === 'processing')
    if (processingStep) {
      return processingStep.message || `Processing ${processingStep.label.toLowerCase()}...`
    }

    const errorStep = steps.find(step => step.status === 'error')
    if (errorStep) {
      return errorStep.message || `${errorStep.label} failed`
    }

    const pendingSteps = steps.filter(step => step.status === 'pending')
    if (pendingSteps.length > 0) {
      return `Waiting to start ${pendingSteps[0].label.toLowerCase()}...`
    }

    return "All steps completed"
  }

  return (
    <div className={cn("rounded-none border-3 bg-card", padding, className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-foreground">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{getCurrentStepMessage()}</span>
          <span className="text-xs text-muted-foreground">
            {Math.round(getOverallProgress())}% complete
          </span>
        </div>
        <Progress
          value={getOverallProgress()}
          className={cn("w-full border-2 border-border rounded-none bg-muted", progressHeight)}
        />
      </div>

      {/* Step Details */}
      <div className={cn("space-y-3", spacing)}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-none border-2 transition-all",
              getStepColor(step.status),
              step.status === 'processing' && "bg-primary/5",
              step.status === 'completed' && "bg-success/5",
              step.status === 'error' && "bg-danger/5"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn("font-bold truncate", textSize)}>
                  {step.label}
                </h4>
                {step.estimatedTime && step.status === 'processing' && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ~{step.estimatedTime}
                  </span>
                )}
              </div>

              {step.message && (
                <p className={cn("text-muted-foreground mt-1", textSize)}>
                  {step.message}
                </p>
              )}

              {step.status === 'processing' && step.progress !== undefined && (
                <Progress
                  value={step.progress}
                  className={cn(
                    "mt-2 border border-border rounded-none",
                    progressHeight,
                    getProgressColor(step.status)
                  )}
                />
              )}

              {step.startedAt && step.status === 'processing' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Started {new Date(step.startedAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex gap-2 flex-shrink-0">
                {step.status === 'processing' && onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(step.id)}
                    className={cn(
                      buttonSize,
                      "font-black border-2 border-danger text-danger hover:bg-danger hover:text-background rounded-none"
                    )}
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                )}

                {step.status === 'error' && onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(step.id)}
                    className={cn(
                      buttonSize,
                      "font-black border-2 border-warning text-warning hover:bg-warning hover:text-background rounded-none"
                    )}
                  >
                    <RefreshCcw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}