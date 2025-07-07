import { Check, FileText, Eye, Pencil } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { icon: Pencil, label: "Basic Info" },
  { icon: FileText, label: "Content" },
  { icon: Eye, label: "Preview" },
]

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <li key={step.label} className="flex-1 relative">
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-semibold",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-2 hidden sm:block text-center text-xs">
                <span
                  className={cn(
                    "font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
