"use client"

import { useState, useEffect, useCallback } from "react"
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
      icon: <Info className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />,
      image: null,
    },
    {
      title: "Reordering Chapters",
      description:
        "You can easily change the order of chapters by dragging and dropping them. Just click and hold the drag handle, then move the chapter to its new position.",
      icon: <DragHandleDots2Icon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />,
      image: (
        <div className="border-4 border-black rounded-lg p-3 md:p-4 bg-yellow-50 my-3 md:my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <DragHandleDots2Icon className="h-4 w-4 md:h-5 md:w-5 text-purple-600 animate-pulse" />
            <div className="h-5 md:h-6 w-32 md:w-40 bg-blue-200 rounded border-2 border-black"></div>
          </div>
          <div className="flex items-center gap-2 relative">
            <motion.div
              animate={{
                y: [0, -5, 0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="absolute -left-4 md:-left-6 -top-4 md:-top-6"
            >
              <MousePointerClick className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
            </motion.div>
            <DragHandleDots2Icon className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <div className="h-8 md:h-10 w-full bg-green-200 rounded border-2 border-black"></div>
          </div>
        </div>
      ),
    },
    {
      title: "Adding Custom Chapters",
      description:
        "You can add your own custom chapters to any unit. Click the 'Add Chapter' button at the bottom of a unit to create a new chapter.",
      icon: <Plus className="h-5 w-5 md:h-6 md:w-6 text-green-600" />,
      image: (
        <div className="border-4 border-black rounded-lg p-3 md:p-4 bg-green-50 my-3 md:my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-16 md:h-20 w-full bg-blue-200 rounded border-2 border-black mb-3"></div>
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
            <Button variant="outline" size="sm" className="w-full border-2 border-black bg-yellow-400 hover:bg-yellow-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-xs md:text-sm">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-black" />
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
              className="absolute -right-4 md:-right-6 -top-4 md:-top-6"
            >
              <MousePointerClick className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
            </motion.div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "Customizing Chapter Content",
      description:
        "After adding a chapter, you can customize its title and add a YouTube video. You can either let our AI generate a video or add your own YouTube video ID.",
      icon: <Edit className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />,
      image: (
        <div className="border-4 border-black rounded-lg p-3 md:p-4 bg-blue-50 my-3 md:my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 md:h-6 w-32 md:w-40 bg-purple-200 rounded border-2 border-black"></div>
            <Edit className="h-3 w-3 md:h-4 md:w-4 text-orange-600 animate-pulse" />
          </div>
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" className="text-xs border-2 border-black bg-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Video className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-black" />
              Add Video
            </Button>
          </div>
          <div className="h-7 md:h-8 w-full bg-yellow-200 rounded flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-black px-2">
            Enter YouTube video ID or URL
          </div>
        </div>
      ),
    },
    {
      title: "Generating Videos",
      description:
        "You can generate videos for your chapters automatically. Click the 'Generate' button on a chapter to create a video based on the chapter title.",
      icon: <Video className="h-5 w-5 md:h-6 md:w-6 text-red-600" />,
      image: (
        <div className="border-4 border-black rounded-lg p-3 md:p-4 bg-purple-50 my-3 md:my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-16 md:h-20 w-full bg-green-200 rounded border-2 border-black mb-3"></div>
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
            <Button size="sm" className="text-xs md:text-sm bg-blue-400 hover:bg-blue-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
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
      icon: <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600" />,
      image: null,
    },
  ]

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }, [currentStep, steps.length])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      onDismissPermanently()
      localStorage.setItem(STORAGE_KEY, "true")
    }
    onClose()
  }, [dontShowAgain, onClose, onDismissPermanently])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[95vw] md:max-w-lg lg:max-w-xl"
        >
          <Card className="shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black bg-white max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="pb-3 md:pb-4 bg-blue-400 border-b-4 border-black flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="px-2 py-0.5 md:py-1 text-[10px] md:text-xs bg-yellow-400 border-2 border-black font-bold">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose} 
                  className="h-7 w-7 md:h-8 md:w-8 bg-red-400 hover:bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                  aria-label="Close help modal"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 text-black" />
                </Button>
              </div>
              <CardTitle className="text-base md:text-xl flex items-center gap-2 text-black font-bold">
                {steps[currentStep].icon}
                <span className="line-clamp-2">{steps[currentStep].title}</span>
              </CardTitle>
              <CardDescription className="text-gray-800 font-medium text-xs md:text-sm mt-1 md:mt-2">
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 md:pt-4 overflow-y-auto flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {steps[currentStep].image}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-3 md:pt-4 border-t-4 border-black bg-gray-50 flex-shrink-0">
              <div className="flex items-center space-x-2 w-full">
                <Checkbox 
                  id="dontShow" 
                  checked={dontShowAgain} 
                  onCheckedChange={(checked) => setDontShowAgain(!!checked)}
                  className="border-2 border-black h-4 w-4 md:h-5 md:w-5"
                />
                <Label htmlFor="dontShow" className="text-xs md:text-sm font-bold cursor-pointer">
                  Don't show this again
                </Label>
              </div>

              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevious} 
                  disabled={currentStep === 0}
                  className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-white hover:bg-gray-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm h-9 md:h-10"
                >
                  <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleNext}
                  className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-green-400 hover:bg-green-500 font-bold text-xs md:text-sm h-9 md:h-10"
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function GuidedHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick} 
      className="flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-yellow-400 hover:bg-yellow-500 font-bold text-xs md:text-sm h-8 md:h-9"
    >
      <Info className="h-3 w-3 md:h-4 md:w-4" />
      <span className="hidden sm:inline">Help</span>
    </Button>
  )
}

export function useGuidedHelp() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    // Check localStorage only once on mount
    const helpDismissed = localStorage.getItem(STORAGE_KEY) === "true"

    // Show help automatically on first visit
    if (!helpDismissed) {
      // Delay showing the help to allow the page to load fully
      const timer = setTimeout(() => {
        setShowHelp(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, []) // Empty dependency array - run only once on mount

  const openHelp = useCallback(() => setShowHelp(true), [])
  const closeHelp = useCallback(() => setShowHelp(false), [])
  const dismissPermanently = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true")
    setShowHelp(false)
  }, [])

  return {
    showHelp,
    openHelp,
    closeHelp,
    dismissPermanently,
  }
}