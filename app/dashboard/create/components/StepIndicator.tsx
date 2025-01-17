'use client'

import * as React from "react"
import { Check, ChevronRight } from 'lucide-react'
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { title: "Basic Info", description: "Course details and category" },
    { title: "Content", description: "Add course materials" },
    { title: "Preview", description: "Review your course" }
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-200" />
        
        {/* Animated progress bar */}
        <motion.div 
          className="absolute top-5 left-0 h-[2px] bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps */}
        <div className="relative flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index + 1
            const isCurrent = currentStep === index + 1
            
            return (
              <div key={index} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <motion.div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200",
                          isCompleted && "border-primary bg-primary",
                          isCurrent && "border-primary bg-primary/10",
                          !isCompleted && !isCurrent && "border-gray-200 bg-white"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCompleted ? (
                          <Check className={cn(
                            "w-5 h-5",
                            isCompleted ? "text-primary-foreground" : "text-primary"
                          )} />
                        ) : (
                          <span className={cn(
                            "font-semibold",
                            isCurrent ? "text-primary" : "text-gray-500"
                          )}>
                            {index + 1}
                          </span>
                        )}
                      </motion.div>
                      <span className={cn(
                        "mt-2 text-sm font-medium hidden md:block",
                        (isCompleted || isCurrent) ? "text-primary" : "text-gray-500"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </TooltipContent>
                </Tooltip>

                {index < steps.length - 1 && (
                  <ChevronRight className={cn(
                    "w-5 h-5 mx-2 hidden md:block",
                    (isCompleted) ? "text-primary" : "text-gray-300"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

