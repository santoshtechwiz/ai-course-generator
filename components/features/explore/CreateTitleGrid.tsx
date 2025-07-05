"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Head from "next/head"
import type { LucideIcon } from "lucide-react"
import { FileQuestion, BookOpen, PenTool, AlignLeft, Code, FileText, Brain, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import useSubscription from "@/hooks/use-subscription"

interface CreateTileGridProps {
  icon: LucideIcon
  title: string
  description: string
  url: string
  index: number
  quotes: string[]
  color: string
  isPremium: boolean
  seoKeywords?: string
  benefits?: string[]
}

const tiles = [  {
    icon: FileQuestion,
    title: "Multiple Choice Questions",
    description:
      "Create effective multiple-choice quizzes that adapt to your students' skill level and provide instant feedback.",
    url: "/dashboard/mcq",
    color: "blue",
    quotes: [
      "Create engaging quizzes that adapt to each student's level",
      "Get detailed analytics on student performance and question effectiveness",
      "Save hours with automatic question generation for any topic",
      "Easily customize difficulty levels for differentiated learning",
      "Export quizzes in multiple formats for online or printed use",
    ],
    isPremium: false,
    seoKeywords: "multiple choice quiz creator, adaptive quizzes, educational assessment tools",
    benefits: [
      "Reduces quiz creation time by 80%",
      "Increases student engagement through personalized questions",
      "Provides detailed analytics on student performance"
    ]
  },
  {
    icon: FileText,
    title: "Document-Based Quizzes",
    description: "Turn your PDFs, articles and notes into interactive quizzes with just one click. Perfect for quick comprehension checks.",
    url: "/dashboard/document",
    color: "amber",
    quotes: [
      "Transform any document into a quiz in under 30 seconds",
      "Create assessments from textbooks, articles, or your own materials",
      "Test reading comprehension with intelligently generated questions",
      "Automatically extract key concepts from complex documents",
      "Save hours of manual question writing with AI assistance",
    ],
    isPremium: false,
    seoKeywords: "document quiz generator, PDF to quiz converter, reading comprehension assessment",
    benefits: [
      "Instantly creates quizzes from any document",
      "Identifies and focuses on key concepts",
      "Works with multiple file formats (PDF, DOCX, TXT)"
    ]
  },
  {
    icon: PenTool,
    title: "Essay & Open Questions",
    description:
      "Create thought-provoking essay questions that encourage critical thinking and deeper analysis of topics.",
    url: "/dashboard/openended",
    color: "green",
    quotes: [
      "Generate thoughtful essay prompts for any subject in seconds",
      "Create questions that develop critical thinking skills",
      "Include helpful guidance notes for each prompt",
      "Structure questions for different educational levels",
      "Create rubrics and grading criteria automatically",
    ],
    isPremium: true,
    seoKeywords: "essay question generator, open-ended assessment, critical thinking questions",
    benefits: [
      "Promotes deeper analysis and critical thinking",
      "Includes automatic rubric creation",
      "Provides scaffolding options for different skill levels"
    ]
  },
  {
    icon: AlignLeft,
    title: "Fill-in-the-Blank Exercises",
    description: "Create gap-fill exercises that reinforce vocabulary and key concepts in an engaging, interactive format.",
    url: "/dashboard/blanks",
    color: "pink",
    quotes: [
      "Create vocabulary-building exercises in seconds",
      "Focus student attention on key terminology and concepts",
      "Generate exercises with adjustable difficulty levels",
      "Include context clues to support learning",
      "Perfect for language learning and technical subjects",
    ],
    isPremium: false,
    seoKeywords: "fill-in-the-blank creator, cloze exercises, vocabulary practice",
    benefits: [
      "Reinforces key terminology and concepts",
      "Adjustable difficulty for differentiated learning",
      "Great for vocabulary building and concept review"
    ]
  },
  {
    icon: BookOpen,
    title: "Complete Course Builder",
    description:
      "Create entire courses with organized modules, lessons, and assessments - all perfectly structured to match your curriculum.",
    url: "/dashboard/create",
    color: "purple",
    quotes: [
      "Design complete courses with a simple, intuitive interface",
      "Organize content into modules, lessons, and assessments",
      "Include multimedia elements for engaging learning experiences",
      "Create learning paths that adapt to student progress",
      "Save weeks of planning and organization time",
    ],
    isPremium: false,
    seoKeywords: "course creator, curriculum builder, online learning platform",
    benefits: [
      "Create complete courses in hours instead of weeks",
      "Includes built-in assessment and tracking tools",
      "Supports multiple media types and interactive elements"
    ]
  },
  {
    icon: Code,
    title: "Coding Exercises",
    description: "Create programming challenges that test real coding skills with automatic grading and feedback.",
    url: "/dashboard/code",
    color: "red",
    quotes: [
      "Create coding challenges for any programming language",
      "Test practical programming skills with real-world problems",
      "Provide instant feedback with automated testing",
      "Generate exercises from beginner to advanced levels",
      "Include starter code and test cases for guided learning",
    ],
    isPremium: true,
    seoKeywords: "coding challenge creator, programming exercises, code assessment",
    benefits: [
      "Supports multiple programming languages",
      "Includes automated testing and feedback",
      "Offers real-world programming scenarios"
    ]
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Create flashcard sets that adapt to your learning progress, focusing on what you need to review most.",
    url: "/dashboard/flashcard",
    color: "indigo",
    quotes: [
      "Create effective study cards with spaced repetition technology",
      "Focus review time on cards you need to practice most",
      "Generate flashcard sets from your notes or textbooks",
      "Track memory retention and learning progress",
      "Study smarter, not longer, with adaptive review sessions",
    ],
    isPremium: false,
    seoKeywords: "adaptive flashcards, spaced repetition, memory retention tools",
    benefits: [
      "Uses proven spaced repetition for better retention",
      "Tracks progress and focuses on challenging content",
      "Creates cards automatically from your study materials"
    ]
  },
]

function Tile({ 
  icon: Icon, 
  title, 
  description, 
  url, 
  index, 
  quotes, 
  color, 
  isPremium, 
  seoKeywords, 
  benefits 
}: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)
  const { data } = useSubscription()

  const quoteInterval = useMemo(() => {
    if (isOpen) {
      return setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length)
      }, 5000)
    }
    return null
  }, [isOpen, quotes.length])

  useEffect(() => {
    return () => {
      if (quoteInterval) clearInterval(quoteInterval)
    }
  }, [quoteInterval])

  const isDisabled = isPremium && (data?.subscriptionPlan === "BASIC" || data?.subscriptionPlan === "FREE")

  return (
    <>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={isDisabled ? {} : { scale: 1.03, y: -5 }}
          whileTap={isDisabled ? {} : { scale: 0.98 }}
          aria-label={`Open details for ${title}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !isDisabled && setIsOpen(true);
            }
          }}
        >
          <Card
            className={`h-full flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
              isDisabled ? "opacity-80 cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={() => !isDisabled && setIsOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl sm:text-2xl">
                <div className="flex items-center">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`text-${color}-500`}
                  >
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3" aria-hidden="true" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {title}
                  </motion.span>
                </div>
                {isPremium && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="ml-2 flex items-center"
                        whileHover={{ scale: 1.2 }}
                      >
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                          Premium
                        </Badge>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Requires premium subscription</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base sm:text-lg text-muted-foreground"
              >
                {description}
              </motion.p>
            </CardContent>
            <CardFooter className="justify-center mt-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  className={`bg-${color}-100 hover:bg-${color}-200 dark:bg-${color}-900 dark:hover:bg-${color}-800 text-${color}-700 dark:text-${color}-300 w-full`}
                  disabled={isDisabled}
                >
                  {isDisabled ? "Upgrade to Access" : "Create Now"}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </TooltipProvider>      <Dialog open={isOpen && !isDisabled} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[80vh] max-h-[90vh] flex flex-col">
          <ScrollArea className="h-full">
            <DialogHeader>
              <DialogTitle className={`flex items-center text-2xl sm:text-4xl text-${color}-500`}>
                <motion.div
                  initial={{ rotate: 0, scale: 0 }}
                  animate={{ rotate: 360, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Icon className="h-8 w-8 sm:h-12 sm:w-12 mr-2 sm:mr-3" aria-hidden="true" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {title}
                </motion.span>
                {isPremium && (
                  <Badge variant="outline" className="ml-3 bg-amber-100 text-amber-800 border-amber-300">
                    Premium Feature
                  </Badge>
                )}
              </DialogTitle>
              
              <DialogDescription asChild>
                <div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentQuote}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="text-lg sm:text-2xl italic mt-4 sm:mt-6"
                    >
                      "{quotes[currentQuote]}"
                    </motion.p>
                  </AnimatePresence>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-base sm:text-lg mt-4 text-muted-foreground"
                  >
                    {description}
                  </motion.p>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-grow flex flex-col space-y-8 py-6 sm:py-10"
            >
              {/* Key Benefits Section */}
              <div className="rounded-lg border p-4 bg-muted/20">
                <h3 className="text-xl font-medium mb-3">Key Benefits</h3>
                <ul className="space-y-2">
                  {benefits?.map((benefit, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex items-start"
                    >
                      <div className={`mr-2 text-${color}-500 mt-1`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              {/* Example Use Case */}
              <div className="rounded-lg border p-4">
                <h3 className="text-xl font-medium mb-3">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Select your topic or upload your content</li>
                  <li>Choose customization options and difficulty level</li>
                  <li>Generate your content with one click</li>
                  <li>Edit, refine, and save your creation</li>
                  <li>Share with students or use in your learning materials</li>
                </ol>
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex justify-center"
              >
                <Icon className={`h-24 w-24 sm:h-32 sm:w-32 text-${color}-500`} aria-hidden="true" />
              </motion.div>
            </motion.div>
          </ScrollArea>
          
          <DialogFooter className="sm:flex-row gap-2 sm:gap-3">
            {isPremium && data?.subscriptionPlan !== "PREMIUM" && (
              <Button
                variant="outline"
                className="w-full sm:w-auto text-base"
                aria-label={`Upgrade to access ${title}`}
                asChild
              >
                <Link href="/pricing">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Upgrade to Premium
                  </motion.span>
                </Link>
              </Button>
            )}
            
            <Button
              asChild
              className={`w-full text-base h-12 sm:h-14 bg-${color}-500 hover:bg-${color}-600 text-white`}
              aria-label={`Get started with ${title}`}
              disabled={isPremium && data?.subscriptionPlan !== "PREMIUM"}
            >
              <Link href={isPremium && data?.subscriptionPlan !== "PREMIUM" ? "/pricing" : url}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPremium && data?.subscriptionPlan !== "PREMIUM" ? "See Pricing Plans" : "Create Now"}
                </motion.span>
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CreateTileGrid() {
  return (
    <>
     
      <section aria-labelledby="content-creation-tools" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {tiles.map((tile, index) => (
            <Tile 
              key={index} 
              {...tile} 
              index={index} 
              isPremium={tile.isPremium} 
            />
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-muted-foreground mb-4">
            Looking for something specific? Our AI can help you create custom educational content.
          </p>
          <Button variant="outline" size="lg" className="mt-2">
            Contact Support
          </Button>
        </div>
      </section>
    </>
  )
}
