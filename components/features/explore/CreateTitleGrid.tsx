"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Head from "next/head";
import type { LucideIcon } from "lucide-react";
import {
  FileQuestion,
  BookOpen,
  PenTool,
  AlignLeft,
  Code,
  FileText,
  Brain,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSubscription from "@/hooks/use-subscription";

// Color mapping for Tailwind CSS classes (ensures classes are generated at build time)
const getColorClasses = (color: string, isPremium: boolean) => {
  const colorMap = {
    blue: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      button: "bg-blue-500 hover:bg-blue-600 text-white"
    },
    green: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      button: "bg-green-500 hover:bg-green-600 text-white"
    },
    purple: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      button: "bg-purple-500 hover:bg-purple-600 text-white"
    },
    orange: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      button: "bg-orange-500 hover:bg-orange-600 text-white"
    },
    teal: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-teal-100 hover:bg-teal-200 dark:bg-teal-900 dark:hover:bg-teal-800 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      button: "bg-teal-500 hover:bg-teal-600 text-white"
    },
    indigo: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      button: "bg-indigo-500 hover:bg-indigo-600 text-white"
    },
    rose: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950 dark:to-orange-950 dark:hover:from-amber-900 dark:hover:to-orange-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:hover:bg-rose-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      button: "bg-rose-500 hover:bg-rose-600 text-white"
    }
  };
  
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};

interface CreateTileGridProps {
  icon: LucideIcon;
  title: string;
  description: string;
  url: string;
  index: number;
  quotes: string[];
  color: string;
  isPremium: boolean;
  seoKeywords?: string;
  benefits?: string[];
}

const tiles = [  {
    icon: FileQuestion,
    title: "Multiple Choice Questions",
    description:
      "Create effective multiple-choice quizzes that adapt to your skill level and provide instant feedback.",
    url: "/dashboard/(quiz)/mcq",
    color: "blue",
    quotes: [
      "Create engaging quizzes that adapt to each learner's level",
      "Get detailed analytics on performance and question effectiveness",
      "Save hours with automatic question generation for any topic",
      "Easily customize difficulty levels for different learning needs",
      "Export quizzes in multiple formats for online or printed use",
    ],
    isPremium: false,
    seoKeywords:
      "multiple choice quiz creator, adaptive quizzes, educational assessment tools",
    benefits: [
      "Reduces quiz creation time by 80%",
      "Increases engagement through personalized questions",
      "Provides detailed analytics on performance",
    ],
  },
  {
    icon: FileText,
    title: "Document-Based Quizzes",
    description:
      "Turn your PDFs, articles and notes into interactive quizzes with just one click. Perfect for quick comprehension checks.",
    url: "/dashboard/(quiz)/document",
    color: "amber",
    quotes: [
      "Transform any document into a quiz in under 30 seconds",
      "Create assessments from textbooks, articles, or your own materials",
      "Test reading comprehension with intelligently generated questions",
      "Automatically extract key concepts from complex documents",
      "Save hours of manual question writing with AI assistance",
      "Transform any document into a quiz in under 30 seconds",
      "Create assessments from textbooks, articles, or your own materials",
      "Test reading comprehension with intelligently generated questions",
      "Automatically extract key concepts from complex documents",
      "Save hours of manual question writing with AI assistance",
    ],
    isPremium: false,
    seoKeywords:
      "document quiz generator, PDF to quiz converter, reading comprehension assessment",
    benefits: [
      "Instantly creates quizzes from any document",
      "Identifies and focuses on key concepts",
      "Works with multiple file formats (PDF, DOCX, TXT)",
    ],
  },
  {
    icon: PenTool,
    title: "Essay & Open Questions",
    description:
      "Create thought-provoking essay questions that encourage critical thinking and deeper analysis of topics.",
    url: "/dashboard/(quiz)/openended",
    color: "green",
    quotes: [
      "Generate thoughtful essay prompts for any subject in seconds",
      "Create questions that develop critical thinking skills",
      "Include helpful guidance notes for each prompt",
      "Structure questions for different educational levels",
      "Create rubrics and grading criteria automatically",
      "Generate thoughtful essay prompts for any subject in seconds",
      "Create questions that develop critical thinking skills",
      "Include helpful guidance notes for each prompt",
      "Structure questions for different educational levels",
      "Create rubrics and grading criteria automatically",
    ],
    isPremium: true,
    seoKeywords:
      "essay question generator, open-ended assessment, critical thinking questions",
    benefits: [
      "Promotes deeper analysis and critical thinking",
      "Includes automatic rubric creation",
      "Provides scaffolding options for different skill levels",
    ],
  },
  {
    icon: AlignLeft,
    title: "Fill-in-the-Blank Exercises",
    description:
      "Create gap-fill exercises that reinforce vocabulary and key concepts in an engaging, interactive format.",
    url: "/dashboard/(quiz)/blanks",
    color: "pink",
    quotes: [
      "Create vocabulary-building exercises in seconds",
      "Focus attention on key terminology and concepts",
      "Generate exercises with adjustable difficulty levels",
      "Include context clues to support learning",
      "Perfect for language learning and technical subjects",
    ],
    isPremium: false,
    seoKeywords:
      "fill-in-the-blank creator, cloze exercises, vocabulary practice",
    benefits: [
      "Reinforces key terminology and concepts",
      "Adjustable difficulty for different learning needs",
      "Great for vocabulary building and concept review",
    ],
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
      "Create learning paths that adapt to progress",
      "Save weeks of planning and organization time",
    ],
    isPremium: false,
    seoKeywords: "course creator, curriculum builder, online learning platform",
    benefits: [
      "Create complete courses in hours instead of weeks",
      "Includes built-in assessment and tracking tools",
      "Supports multiple media types and interactive elements",
    ],
  },
  {
    icon: Code,
    title: "Coding Exercises",
    description:
      "Create programming challenges that test real coding skills with automatic grading and feedback.",
    url: "/dashboard/(quiz)/code",
    color: "red",
    quotes: [
      "Create coding challenges for any programming language",
      "Test practical programming skills with real-world problems",
      "Provide instant feedback with automated testing",
      "Generate exercises from beginner to advanced levels",
      "Include starter code and test cases for guided learning",
    ],
    isPremium: false,
    seoKeywords:
      "coding challenge creator, programming exercises, code assessment",
    benefits: [
      "Supports multiple programming languages",
      "Includes automated testing and feedback",
      "Offers real-world programming scenarios",
    ],
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description:
      "Create flashcard sets that adapt to your learning progress, focusing on what you need to review most.",
    url: "/dashboard/(quiz)/flashcard",
    color: "indigo",

    quotes: [
      "Create effective study cards with spaced repetition technology",
      "Focus review time on cards you need to practice most",
      "Generate flashcard sets from your notes or textbooks",
      "Track memory retention and learning progress",
      "Study smarter, not longer, with adaptive review sessions",
      "Create effective study cards with spaced repetition technology",
      "Focus review time on cards you need to practice most",
      "Generate flashcard sets from your notes or textbooks",
      "Track memory retention and learning progress",
      "Study smarter, not longer, with adaptive review sessions",
    ],
    isPremium: false,
    seoKeywords:
      "adaptive flashcards, spaced repetition, memory retention tools",
    benefits: [
      "Uses proven spaced repetition for better retention",
      "Tracks progress and focuses on challenging content",
      "Creates cards automatically from your study materials",
    ],
  },
];

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
  benefits,
}: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const { data } = useSubscription();

  const quoteInterval = useMemo(() => {
    if (isOpen) {
      return setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
      }, 5000);
    }
    return null;
  }, [isOpen, quotes.length]);

  useEffect(() => {
    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [quoteInterval]);

  // Fixed logic: Premium features are disabled for FREE users, enabled for BASIC and PREMIUM
  const isDisabled = isPremium && data?.plan === "FREE";

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
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              !isDisabled && setIsOpen(true);
            }
          }}
        >
          <Card
            className={`h-full flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
              isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-xl"
            }`}
            onClick={() => !isDisabled && setIsOpen(true)}
          >
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg md:text-xl">
                <div className="flex items-center min-w-0 flex-1">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`text-${color}-500 flex-shrink-0`}
                  >
                    <Icon
                      className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 mr-2"
                      aria-hidden="true"
                    />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="truncate"
                  >
                    {title}
                  </motion.span>
                </div>
                {isPremium && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="ml-2 flex items-center flex-shrink-0"
                        whileHover={{ scale: 1.2 }}
                      >
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 font-medium text-xs"
                        >
                          Premium
                        </Badge>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Requires subscription to access</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3"
              >
                {description}
              </motion.p>
            </CardContent>
            <CardFooter className="justify-center mt-2">
              <motion.div
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                className="w-full"
              >
                <Button
                  variant={isDisabled ? "outline" : "secondary"}
                  className={`${
                    isDisabled 
                      ? "border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100" 
                      : `bg-${color}-100 hover:bg-${color}-200 dark:bg-${color}-900 dark:hover:bg-${color}-800 text-${color}-700 dark:text-${color}-300`
                  } w-full transition-all duration-200`}
                  disabled={isDisabled}
                >
                  {isDisabled ? "Upgrade to Access" : "Get Started"}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </TooltipProvider>
      
      <Dialog open={isOpen && !isDisabled} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[80vh] max-h-[90vh] flex flex-col">
          <ScrollArea className="h-full">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center text-2xl sm:text-4xl text-${color}-500`}
              >
                <motion.div
                  initial={{ rotate: 0, scale: 0 }}
                  animate={{ rotate: 360, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Icon
                    className="h-8 w-8 sm:h-12 sm:w-12 mr-2 sm:mr-3"
                    aria-hidden="true"
                  />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {title}
                </motion.span>
                {isPremium && (
                  <Badge
                    variant="outline"
                    className="ml-3 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 font-medium"
                  >
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
                      className="text-lg sm:text-2xl italic mt-4 sm:mt-6 text-center"
                    >
                      "{quotes[currentQuote]}"
                    </motion.p>
                  </AnimatePresence>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-base sm:text-lg mt-4 text-muted-foreground leading-relaxed"
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
              <div className="rounded-lg border p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <div className={`mr-2 text-${color}-500`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                      <path d="M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </div>
                  Key Benefits
                </h3>
                <ul className="space-y-3">
                  {benefits?.map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start"
                    >
                      <div className={`mr-3 text-${color}-500 mt-1 flex-shrink-0`}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="text-sm sm:text-base">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* How It Works Section */}
              <div className="rounded-lg border p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <div className={`mr-2 text-${color}-500`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6"/>
                      <path d="m15.5 3.5-1.5 1.5"/>
                      <path d="m10 12-1.5 1.5"/>
                      <path d="m15.5 20.5-1.5-1.5"/>
                      <path d="m4.5 10.5 1.5 1.5"/>
                      <path d="m20.5 10.5-1.5 1.5"/>
                      <path d="m4.5 13.5 1.5-1.5"/>
                    </svg>
                  </div>
                  How It Works
                </h3>
                <ol className="space-y-2">
                  <li className="flex items-start">
                    <span className={`mr-3 text-${color}-500 font-semibold flex-shrink-0`}>1.</span>
                    <span className="text-sm sm:text-base">Select your topic or upload your content</span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-3 text-${color}-500 font-semibold flex-shrink-0`}>2.</span>
                    <span className="text-sm sm:text-base">Choose customization options and difficulty level</span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-3 text-${color}-500 font-semibold flex-shrink-0`}>3.</span>
                    <span className="text-sm sm:text-base">Generate your content with one click</span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-3 text-${color}-500 font-semibold flex-shrink-0`}>4.</span>
                    <span className="text-sm sm:text-base">Edit, refine, and save your creation</span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-3 text-${color}-500 font-semibold flex-shrink-0`}>5.</span>
                    <span className="text-sm sm:text-base">Share or use in your learning materials</span>
                  </li>
                </ol>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex justify-center"
         
              >
                <Icon
                  className={`h-24 w-24 sm:h-32 sm:w-32 text-${color}-500 opacity-20`}
                  aria-hidden="true"
                />
              </motion.div>
            </motion.div>
          </ScrollArea>

          <DialogFooter className="sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
            {data?.plan === "FREE" && isPremium && (
              <Button
                variant="outline"
                className="w-full sm:w-auto text-base border-amber-300 text-amber-700 hover:bg-amber-50"
                aria-label={`Upgrade to access ${title}`}
                asChild
              >
                <Link href="/dashboard/subscription">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Upgrade to Access
                  </motion.span>
                </Link>
              </Button>
            )}

            <Button
              asChild
              className={`w-full text-base h-12 sm:h-14 ${getColorClasses(color, isPremium).button} shadow-lg`}
              aria-label={`Get started with ${title}`}
              disabled={isPremium && data?.plan !== "PREMIUM"}
            >
              <Link href={isPremium && data?.plan !== "PREMIUM" ? "/pricing" : url}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Now
                </motion.span>
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateTileGrid() {
  return (
    <>
      <section
        aria-labelledby="content-creation-tools"
        className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-5 py-4 sm:py-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 auto-rows-fr">
          {tiles.map((tile, index) => (
            <Tile
              key={index}
              {...tile}
              index={index}
              isPremium={tile.isPremium}
            />
          ))}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <p className="text-muted-foreground mb-4 text-base sm:text-lg">
              Looking for something specific? Our AI can help you create custom educational content.
            </p>
            <Button 
              variant="outline" 
              size="lg" 
              className="mt-2 px-6 py-2 text-base hover:shadow-md transition-all duration-200"
              onClick={() => window.location.href = '/contactus'}
            >
              Contact Support
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}

