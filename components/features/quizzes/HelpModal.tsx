"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const steps = [
  {
    title: "Welcome to the Fill in the Blanks Quiz!",
    description: "This guide will walk you through how to play the quiz and how the matching system works.",
  },
  {
    title: "How to Play",
    description:
      "You'll be presented with sentences that have blank spaces. Your task is to fill in these blanks with the correct words or phrases.",
  },
  {
    title: "Answering Questions",
    description:
      "Type your answer in the input field provided. Once you're confident, click 'Submit' to move to the next question.",
  },
  {
    title: "Matching System",
    description:
      "Our system uses advanced matching algorithms to evaluate your answers. It considers synonyms, minor spelling errors, and contextual relevance.",
  },
  {
    title: "Scoring",
    description:
      "You'll receive points based on the accuracy of your answers. Perfect matches get full points, while close matches may receive partial credit.",
  },
  {
    title: "Ready to Start?",
    description: "Now that you know how it works, let's begin the quiz! Good luck!",
  },
]

interface GuidedHelpProps {
  isOpen: boolean
  onClose: () => void
}

export const GuidedHelp: React.FC<GuidedHelpProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleNext}>{currentStep === steps.length - 1 ? "Start Quiz" : "Next"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
