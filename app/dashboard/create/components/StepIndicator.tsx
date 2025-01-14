
import { Check, ChevronRight } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { title: "Basic Info", completed: currentStep > 1 },
    { title: "Content", completed: currentStep > 2 },
    { title: "Preview", completed: false }
  ]

  return (
    <div className="flex items-center justify-between mb-4">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full 
            ${s.completed ? 'bg-primary' : currentStep === i + 1 ? 'bg-primary' : 'bg-muted'} 
            transition-colors duration-200`}>
            {s.completed ? (
              <Check className="w-6 h-6 text-primary-foreground" />
            ) : (
              <span className="text-primary-foreground font-semibold">{i + 1}</span>
            )}
          </div>
          <span className="ml-3 font-medium">{s.title}</span>
          {i < steps.length - 1 && (
            <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  )
}

