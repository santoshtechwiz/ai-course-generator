"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Edit,
  Video,
  Plus,
  CheckCircle2,
  MousePointerClick,
  X,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const STORAGE_KEY = "chapter-editor-help-dismissed"

interface GuidedHelpProps {
  onClose: () => void
  onDismissPermanently: () => void
}

export function GuidedHelp({ onClose, onDismissPermanently }: GuidedHelpProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const steps = [
    {
      title: "Welcome to the Chapter Editor",
      description:
        "Let's learn how to organize and customize your course chapters. This quick guide will show you how to reorder chapters and add custom content.",
  icon: <Info className="h-6 w-6 text-accent" />,
      image: null,
    },
    {
      title: "Reordering Chapters",
      description:
        "You can easily change the order of chapters by dragging and dropping them. Just click and hold the drag handle, then move the chapter to its new position.",
  icon: <GripVertical className="h-6 w-6 text-accent" />,
      image: (
        <div className="border-3 border-border rounded-none p-4 my-4">
          <div className="flex items-center gap-2 mb-2">
            <GripVertical className="h-5 w-5 text-accent animate-pulse" />
            <div className="h-6 w-40 bg-muted rounded-none border-2 border-border"></div>
          </div>
          <div className="flex items-center gap-2 ">
            <motion.div
              animate={{
                y: [0, -5, 0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="absolute -left-6 -top-6"
            >
              <MousePointerClick className="h-5 w-5 text-accent" />
            </motion.div>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="h-10 w-full bg-muted rounded-none border-2 border-border"></div>
          </div>
        </div>
      ),
    },
    {
      title: "Adding Custom Chapters",
      description:
        "You can add your own custom chapters to any unit. Click the 'Add Chapter' button at the bottom of a unit to create a new chapter.",
  icon: <Plus className="h-6 w-6 text-success" />,
      image: (
        <div className="border-3 border-border rounded-none p-4 bg-muted/50 my-4">
          <div className="h-20 w-full bg-muted rounded-none border-2 border-border mb-3"></div>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="relative"
          >
            <Button variant="outline" size="sm" className="w-full font-black border-4 border-border rounded-none">
              <Plus className="h-4 w-4 mr-2 text-success" />
              Add Chapter
            </Button>
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.5,
              }}
              className="absolute -right-6 -top-6"
            >
              <MousePointerClick className="h-5 w-5 text-success" />
            </motion.div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "Customizing Chapter Content",
      description:
        "After adding a chapter, you can customize its title and add a YouTube video. You can either let our AI generate a video or add your own YouTube video ID.",
  icon: <Edit className="h-6 w-6 text-accent" />,
      image: (
        <div className="border-3 border-border rounded-none p-4 bg-muted/50 my-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-40 bg-muted rounded-none border-2 border-border"></div>
            <Edit className="h-4 w-4 text-accent animate-pulse" />
          </div>
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" className="text-xs font-black border-2 border-border rounded-none">
              <Video className="h-3.5 w-3.5 mr-1 text-purple-500" />
              Add Video
            </Button>
          </div>
          <div className="h-8 w-full bg-purple-500/10 rounded-none border-2 border-purple-500 flex items-center justify-center text-xs text-purple-500 font-black">
            Enter YouTube video ID or URL
          </div>
        </div>
      ),
    },
    {
      title: "Generating Videos",
      description:
        "You can generate videos for your chapters automatically. Click the 'Generate' button on a chapter to create a video based on the chapter title.",
  icon: <Video className="h-6 w-6 text-destructive" />,
      image: (
        <div className="border-3 border-border rounded-none p-4 bg-muted/50 my-4">
          <div className="h-20 w-full bg-muted rounded-none border-2 border-border mb-3"></div>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="flex justify-end"
          >
            <Button size="sm" className="text-xs font-black bg-destructive hover:bg-red-600 text-white border-4 border-border rounded-none">
              Generate
            </Button>
          </motion.div>
        </div>
      ),
    },
    {
      title: "You're All Set!",
      description:
        "Now you know how to organize and customize your course chapters. Feel free to experiment and create the perfect course structure.",
  icon: <CheckCircle2 className="h-6 w-6 text-success" />,
      image: null,
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    if (dontShowAgain) {
      onDismissPermanently()
      localStorage.setItem(STORAGE_KEY, "true")
    }
    onClose()
  }

  return (
    <Card className="w-full max-w-xl mx-auto shadow-neo border-4 border-border rounded-lg bg-card ring-2 ring-white/10">
      <CardHeader className="pb-4 border-b-4 border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-black bg-accent/10 border-2 border-accent text-accent rounded-none">
            Step {currentStep + 1} of {steps.length}
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 border-2 border-transparent hover:border-border rounded-none">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-3 mt-3 text-card-foreground">
          {steps[currentStep].icon}
          {steps[currentStep].title}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm font-medium mt-2 text-muted-foreground">{steps[currentStep].description}</CardDescription>
      </CardHeader>

      <CardContent className="min-h-[200px] flex items-center justify-center">
        {steps[currentStep].image}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4 border-t-4 border-border bg-muted/30">
        <div className="flex items-center space-x-2 w-full">
          <Checkbox 
            id="dontShow" 
            checked={dontShowAgain} 
            onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            className="border-2 border-border rounded-none data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <Label htmlFor="dontShow" className="text-sm font-medium cursor-pointer">
            Don't show this again
          </Label>
        </div>

        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
            className="flex-1 font-black border-4 border-border rounded-none shadow-neo hover:shadow-neo-hover disabled:opacity-50 text-sm sm:text-base py-2 sm:py-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button 
            size="sm" 
            onClick={handleNext}
            className="flex-1 font-black border-4 border-border rounded-none bg-accent hover:bg-accent/90 text-background shadow-neo hover:shadow-neo-hover text-sm sm:text-base py-2 sm:py-3"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function GuidedHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick} 
      className="flex items-center gap-2 font-black border-4 border-border rounded-none shadow-neo hover:shadow-neo-hover"
    >
      <Info className="h-4 w-4" />
      <span>Help</span>
    </Button>
  )
}

export function useGuidedHelp() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const helpDismissed = localStorage.getItem(STORAGE_KEY) === "true"

    if (!helpDismissed) {
      const timer = setTimeout(() => {
        setShowHelp(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const openHelp = () => setShowHelp(true)
  const closeHelp = () => setShowHelp(false)
  const dismissPermanently = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    closeHelp()
  }

  return {
    showHelp,
    openHelp,
    closeHelp,
    dismissPermanently,
  }
}