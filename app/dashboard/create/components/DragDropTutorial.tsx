"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  DotIcon as DragHandleDots2Icon,
  Edit,
  Video,
  Plus,
  CheckCircle2,
  MousePointerClick,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/tailwindUtils"

const STORAGE_KEY = "dragdrop-tutorial-completed"

type TutorialStep = {
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right" | "center"
  action?: string
  icon?: React.ReactNode
  highlightClass?: string
}

export function DragDropTutorial() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to the Course Editor",
      description: "Let's walk through how to organize and customize your course content. Click Next to continue.",
      target: "body",
      position: "center",
      icon: <MousePointerClick className="h-5 w-5 text-primary" />,
    },
    {
      title: "Reordering Units",
      description:
        "Click and hold this drag handle, then drag the unit up or down to reorder it. Changes are saved automatically.",
      target: "[data-sidebar='unit-drag-handle']",
      position: "left",
      action: "Drag to reorder - changes save automatically",
      icon: <DragHandleDots2Icon className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2 animate-pulse",
    },
    {
      title: "Editing Unit Titles",
      description: "Click on any unit title to edit it. Try clicking on this title now.",
      target: "[data-sidebar='unit-title']",
      position: "bottom",
      action: "Click to edit",
      icon: <Edit className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2",
    },
    {
      title: "Reordering Chapters",
      description: "Chapters can also be reordered. Click and drag this handle to move the chapter.",
      target: "[data-sidebar='chapter-drag-handle']",
      position: "left",
      action: "Drag the chapter",
      icon: <DragHandleDots2Icon className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2",
    },
    {
      title: "Adding Videos",
      description: "Click this button to add or edit a YouTube video for this chapter.",
      target: "[data-sidebar='video-button']",
      position: "right",
      action: "Click to add video",
      icon: <Video className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2 animate-pulse",
    },
    {
      title: "Adding New Chapters",
      description: "Click this button to add a new chapter to the unit.",
      target: "[data-sidebar='add-chapter-button']",
      position: "top",
      action: "Click to add chapter",
      icon: <Plus className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2 animate-pulse",
    },
    {
      title: "Adding New Units",
      description: "Click this button to add a new unit to your course.",
      target: "[data-sidebar='add-unit-button']",
      position: "top",
      action: "Click to add unit",
      icon: <Plus className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2 animate-pulse",
    },
    {
      title: "Generating Videos",
      description: "When you're ready, click this button to generate videos for all chapters.",
      target: "[data-sidebar='generate-button']",
      position: "left",
      action: "Click to generate",
      icon: <Video className="h-5 w-5 text-primary" />,
      highlightClass: "ring-2 ring-primary ring-offset-2 animate-pulse",
    },
    {
      title: "Automatic Saving",
      description:
        "All changes you make are automatically saved to the database. You'll see a saving indicator when changes are being processed.",
      target: "body",
      position: "center",
      icon: <Save className="h-5 w-5 text-primary" />,
    },
    {
      title: "Tutorial Complete!",
      description:
        "You now know how to use the drag-and-drop course editor. Feel free to explore and create your course!",
      target: "body",
      position: "center",
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    },
  ]

  useEffect(() => {
    // Check if tutorial has been completed before
    const tutorialCompleted = localStorage.getItem(STORAGE_KEY) === "true"

    if (!tutorialCompleted) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (isVisible && currentStep < tutorialSteps.length) {
      const step = tutorialSteps[currentStep]

      // Find the target element
      let targetElement: HTMLElement | null = null

      if (step.target === "body") {
        targetElement = document.body
      } else {
        targetElement = document.querySelector(step.target) as HTMLElement
      }

      setHighlightedElement(targetElement)

      // Position the tooltip relative to the target
      if (tooltipRef.current && targetElement && step.position !== "center") {
        positionTooltip(tooltipRef.current, targetElement, step.position)
      }
    }
  }, [isVisible, currentStep, tutorialSteps])

  const positionTooltip = (tooltip: HTMLElement, target: HTMLElement, position: string) => {
    const targetRect = target.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    // Calculate the position
    let top = 0
    let left = 0

    switch (position) {
      case "top":
        top = targetRect.top - tooltipRect.height - 10
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        break
      case "bottom":
        top = targetRect.bottom + 10
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        break
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        left = targetRect.left - tooltipRect.width - 10
        break
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        left = targetRect.right + 10
        break
    }

    // Apply the position
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeTutorial()
  }

  const completeTutorial = () => {
    setIsCompleted(true)
    localStorage.setItem(STORAGE_KEY, "true")

    // Show completion animation then hide
    setTimeout(() => {
      setIsVisible(false)
    }, 2000)
  }

  // Apply highlight to the target element
  useEffect(() => {
    if (highlightedElement && tutorialSteps[currentStep].highlightClass) {
      const originalClasses = highlightedElement.className
      highlightedElement.className = `${originalClasses} ${tutorialSteps[currentStep].highlightClass}`

      return () => {
        highlightedElement.className = originalClasses
      }
    }
  }, [highlightedElement, currentStep, tutorialSteps])

  if (!isVisible) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const isCentered = currentTutorialStep.position === "center"

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={handleSkip} />

      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="completion"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card p-8 rounded-xl shadow-xl pointer-events-auto max-w-md w-full text-center"
          >
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tutorial Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You're now ready to create amazing courses with our drag-and-drop editor.
            </p>
            <Button onClick={() => setIsVisible(false)}>Start Creating</Button>
          </motion.div>
        ) : (
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            ref={tooltipRef}
            className={cn(
              "absolute bg-card p-4 rounded-lg shadow-lg pointer-events-auto max-w-sm",
              isCentered ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" : "",
            )}
            style={isCentered ? undefined : { position: "absolute" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                {currentTutorialStep.icon || <MousePointerClick className="h-5 w-5" />}
              </div>
              <h3 className="font-semibold text-lg">{currentTutorialStep.title}</h3>
            </div>

            <p className="text-muted-foreground mb-4">{currentTutorialStep.description}</p>

            {currentTutorialStep.action && (
              <div className="bg-muted p-2 rounded-md mb-4 text-sm flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <span>{currentTutorialStep.action}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
