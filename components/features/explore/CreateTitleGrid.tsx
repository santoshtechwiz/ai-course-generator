"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FileQuestion,
  BookOpen,
  PenTool,
  AlignLeft,
  Code,
  FileText,
  Brain,
  Sparkles,
  Clock,
  Target,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
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
import { useSubscription } from "@/modules/auth/hooks/useSubscription";

// Enhanced color system with gradients
const getColorClasses = (color: string, isPremium: boolean) => {
  const colorMap = {
    blue: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 dark:hover:from-blue-900 dark:hover:via-indigo-900 dark:hover:to-purple-900 border-blue-200 dark:border-blue-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
    },
    green: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 hover:from-green-100 hover:via-emerald-100 hover:to-teal-100 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 dark:hover:from-green-900 dark:hover:via-emerald-900 dark:hover:to-teal-900 border-green-200 dark:border-green-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
    },
    purple: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 hover:from-purple-100 hover:via-violet-100 hover:to-fuchsia-100 dark:from-purple-950 dark:via-violet-950 dark:to-fuchsia-950 dark:hover:from-purple-900 dark:hover:via-violet-900 dark:hover:to-fuchsia-900 border-purple-200 dark:border-purple-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
    },
    orange: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 hover:from-orange-100 hover:via-red-100 hover:to-pink-100 dark:from-orange-950 dark:via-red-950 dark:to-pink-950 dark:hover:from-orange-900 dark:hover:via-red-900 dark:hover:to-pink-900 border-orange-200 dark:border-orange-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-orange-600 dark:text-orange-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
    },
    teal: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 hover:from-teal-100 hover:via-cyan-100 hover:to-sky-100 dark:from-teal-950 dark:via-cyan-950 dark:to-sky-950 dark:hover:from-teal-900 dark:hover:via-cyan-900 dark:hover:to-sky-900 border-teal-200 dark:border-teal-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
    },
    indigo: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 hover:from-indigo-100 hover:via-blue-100 hover:to-cyan-100 dark:from-indigo-950 dark:via-blue-950 dark:to-cyan-950 dark:hover:from-indigo-900 dark:hover:via-blue-900 dark:hover:to-cyan-900 border-indigo-200 dark:border-indigo-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
    },
    rose: {
      card: isPremium 
        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 hover:from-amber-100 hover:via-orange-100 hover:to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 dark:hover:from-amber-900 dark:hover:via-orange-900 dark:hover:to-yellow-900 border-amber-200 dark:border-amber-700"
        : "bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 hover:from-rose-100 hover:via-pink-100 hover:to-purple-100 dark:from-rose-950 dark:via-pink-950 dark:to-purple-950 dark:hover:from-rose-900 dark:hover:via-pink-900 dark:hover:to-purple-900 border-rose-200 dark:border-rose-700",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
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
  taglines: string[];
  color: string;
  isPremium: boolean;
  benefits?: string[];
  timeToCreate?: string;
  difficulty?: "Easy" | "Medium" | "Advanced";
}

const tiles = [
  {
    icon: FileQuestion,
    title: "Quiz Maker",
    description: "Make fun quizzes in seconds. Perfect for testing what you know.",
    url: "/dashboard/mcq",
    color: "blue",
    taglines: [
      "Build quizzes that fit your learning style",
      "Get instant feedback on your answers",
      "Save hours with smart question creation",
      "Perfect for any subject or topic"
    ],
    isPremium: false,
    timeToCreate: "2 minutes",
    difficulty: "Easy" as const,
    benefits: [
      "Creates quizzes 10x faster",
      "Smart difficulty matching",
      "Instant performance tracking"
    ],
  },
  {
    icon: FileText,
    title: "Document Quiz",
    description: "Turn any PDF or document into a quiz instantly. Great for study materials.",
    url: "/dashboard/document",
    color: "orange",
    taglines: [
      "Upload any document, get a quiz in 30 seconds",
      "Perfect for textbooks and study materials",
      "Smart questions from your content",
      "Works with PDFs, Word docs, and more"
    ],
    isPremium: false,
    timeToCreate: "1 minute",
    difficulty: "Easy" as const,
    benefits: [
      "Instant quiz from any document",
      "Finds the most important points",
      "Supports all file types"
    ],
  },
  {
    icon: PenTool,
    title: "Essay Questions",
    description: "Create thoughtful essay questions that make you think deeper about topics.",
    url: "/dashboard/openended",
    color: "green",
    taglines: [
      "Build questions that make you think",
      "Perfect for deeper learning",
      "Get writing prompts instantly",
      "Great for any subject level"
    ],
    isPremium: false,
    timeToCreate: "3 minutes",
    difficulty: "Medium" as const,
    benefits: [
      "Develops critical thinking",
      "Automatic grading help",
      "Fits any learning level"
    ],
  },
  {
    icon: AlignLeft,
    title: "Fill the Blanks",
    description: "Create gap-fill exercises to practice vocabulary and key concepts.",
    url: "/dashboard/blanks",
    color: "rose",
    taglines: [
      "Master vocabulary with fun exercises",
      "Focus on the most important terms",
      "Adjust difficulty as you learn",
      "Perfect for language learning"
    ],
    isPremium: false,
    timeToCreate: "2 minutes",
    difficulty: "Easy" as const,
    benefits: [
      "Builds vocabulary fast",
      "Smart difficulty levels",
      "Great for memorization"
    ],
  },
  {
    icon: BookOpen,
    title: "Course Builder",
    description: "Build complete courses with lessons, quizzes, and everything organized perfectly.",
    url: "/dashboard/create",
    color: "purple",
    taglines: [
      "Create full courses in hours, not weeks",
      "Everything organized and ready to use",
      "Add videos, quizzes, and more",
      "Track user progress easily"
    ],
    isPremium: false,
    timeToCreate: "30 minutes",
    difficulty: "Advanced" as const,
    benefits: [
      "Complete course in hours",
      "Built-in progress tracking",
      "Multiple content types"
    ],
  },
  {
    icon: Code,
    title: "Coding Practice",
    description: "Create coding challenges that test real programming skills with instant feedback.",
    url: "/dashboard/code",
    color: "teal",
    taglines: [
      "Practice coding with real challenges",
      "Get instant feedback on your code",
      "Learn any programming language",
      "From beginner to expert level"
    ],
    isPremium: false,
    timeToCreate: "5 minutes",
    difficulty: "Medium" as const,
    benefits: [
      "Multiple programming languages",
      "Automatic code testing",
      "Real-world problems"
    ],
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Create flashcards that learn with you and focus on what you need most.",
    url: "/dashboard/flashcard",
    color: "indigo",
    taglines: [
      "Study smarter with AI-powered cards",
      "Focus on what you need to learn",
      "Remember more with smart repetition",
      "Track your learning progress"
    ],
    isPremium: false,
    timeToCreate: "3 minutes",
    difficulty: "Easy" as const,
    benefits: [
      "Proven memory techniques",
      "Focuses on weak areas",
      "Auto-creates from your notes"
    ],
  },
];

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: index * 0.1,
      type: "spring",
      stiffness: 100
    }
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 300
    }
  }
};

const iconVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.2, 
    rotate: 360,
    transition: { duration: 0.6, type: "spring" }
  },
  tap: { scale: 0.9 }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return "bg-green-100 text-green-700 border-green-200";
    case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Advanced": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

function Tile({
  icon: Icon,
  title,
  description,
  url,
  index,
  taglines,
  color,
  isPremium,
  benefits,
  timeToCreate,
  difficulty,
}: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const taglineInterval = useMemo(() => {
    if (isOpen) {
      return setInterval(() => {
        setCurrentTagline((prev) => (prev + 1) % taglines.length);
      }, 3500);
    }
    return null;
  }, [isOpen, taglines.length]);

  useEffect(() => {
    return () => {
      if (taglineInterval) clearInterval(taglineInterval);
    };
  }, [taglineInterval]);

  const colorClasses = getColorClasses(color, isPremium);

  return (
    <>
      <TooltipProvider>
        <motion.div
          custom={index}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          variants={cardVariants}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="h-full"
        >
          <Card
            className={`h-full flex flex-col justify-between transition-all duration-500 border-2 ${colorClasses.card} cursor-pointer hover:shadow-2xl hover:shadow-black/10 relative overflow-hidden group`}
            onClick={() => setIsOpen(true)}
          >
            {/* Floating elements background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ 
                  x: [0, 20, 0],
                  y: [0, -15, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-4 right-4 opacity-5"
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
              
              <motion.div
                animate={{ 
                  x: [0, -15, 0],
                  y: [0, 20, 0],
                  rotate: [0, -180, -360]
                }}
                transition={{ 
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute bottom-4 left-4 opacity-5"
              >
                <Star className="h-6 w-6" />
              </motion.div>
            </div>

            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center justify-between text-lg font-bold">
                <div className="flex items-center min-w-0 flex-1">
                  <motion.div
                    variants={iconVariants}
                    initial="initial"
                    animate={isHovered ? "hover" : "initial"}
                    whileTap="tap"
                    className={`${colorClasses.icon} flex-shrink-0 mr-3`}
                  >
                    <Icon className="h-7 w-7" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className="truncate"
                  >
                    {title}
                  </motion.span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPremium && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 font-semibold text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Pro
                          </Badge>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Premium feature - upgrade to unlock</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardTitle>
              
              {/* Metadata */}
              <div className="flex items-center gap-3 mt-2">
                <motion.div 
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                  whileHover={{ scale: 1.05 }}
                >
                  <Clock className="h-3 w-3" />
                  {timeToCreate}
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(difficulty!)}`}>
                    <Target className="h-3 w-3 mr-1" />
                    {difficulty}
                  </Badge>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent className="py-2 flex-1">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {description}
              </motion.p>
            </CardContent>

            <CardFooter className="pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                <Button className={`w-full transition-all duration-300 font-semibold ${colorClasses.button} text-white shadow-lg hover:shadow-xl group`}>
                  <span className="flex items-center justify-center">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <ScrollArea className="max-h-[80vh] pr-6">
            <DialogHeader className="space-y-6">
              <DialogTitle className="flex items-center justify-between">
                <div className={`flex items-center text-3xl font-bold ${colorClasses.icon}`}>
                  <motion.div
                    initial={{ rotate: 0, scale: 0.8 }}
                    animate={{ rotate: 360, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      type: "spring",
                      stiffness: 200 
                    }}
                  >
                    <Icon className="h-10 w-10 mr-4" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {title}
                  </motion.span>
                </div>
                
                <div className="flex items-center gap-3">
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium Feature
                    </Badge>
                  )}
                  <Badge variant="outline" className={getDifficultyColor(difficulty!)}>
                    {difficulty}
                  </Badge>
                </div>
              </DialogTitle>

              <DialogDescription asChild>
                <div className="space-y-6">
                  {/* Rotating taglines */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTagline}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 1.05 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="text-center py-6 bg-muted/20 rounded-xl border"
                    >
                      <p className="text-xl font-medium italic px-6">
                        "{taglines[currentTagline]}"
                      </p>
                      <div className="flex justify-center mt-4 space-x-2">
                        {taglines.map((_, i) => (
                          <motion.div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors ${
                              i === currentTagline ? colorClasses.icon.replace('text-', 'bg-') : 'bg-gray-300'
                            }`}
                            animate={{ scale: i === currentTagline ? 1.2 : 1 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-lg text-muted-foreground leading-relaxed text-center"
                  >
                    {description}
                  </motion.p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-8">
              {/* Quick stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="text-center p-4 rounded-lg bg-muted/30 border">
                  <Clock className={`h-8 w-8 mx-auto mb-2 ${colorClasses.icon}`} />
                  <div className="font-semibold">{timeToCreate}</div>
                  <div className="text-sm text-muted-foreground">Time to Create</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30 border">
                  <Target className={`h-8 w-8 mx-auto mb-2 ${colorClasses.icon}`} />
                  <div className="font-semibold">{difficulty}</div>
                  <div className="text-sm text-muted-foreground">Difficulty</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30 border">
                  <Zap className={`h-8 w-8 mx-auto mb-2 ${colorClasses.icon}`} />
                  <div className="font-semibold">AI Powered</div>
                  <div className="text-sm text-muted-foreground">Smart Creation</div>
                </div>
              </motion.div>

              {/* Key Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold flex items-center">
                  <CheckCircle className={`h-6 w-6 mr-3 ${colorClasses.icon}`} />
                  What You Get
                </h3>
                <div className="grid gap-4">
                  {benefits?.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center p-4 rounded-lg bg-muted/20 border hover:bg-muted/30 transition-colors"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                        className={`mr-4 ${colorClasses.icon}`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </motion.div>
                      <span className="font-medium">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold flex items-center">
                  <Sparkles className={`h-6 w-6 mr-3 ${colorClasses.icon}`} />
                  How It Works
                </h3>
                <div className="grid gap-4">
                  {[
                    "Choose your topic or upload content",
                    "Pick your settings and difficulty",
                    "Click create and watch the magic",
                    "Edit and perfect your creation",
                    "Share or use in your learning"
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center p-3 rounded-lg border bg-background/50"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-8 h-8 rounded-full ${colorClasses.button} text-white flex items-center justify-center font-bold mr-4 flex-shrink-0`}
                      >
                        {i + 1}
                      </motion.div>
                      <span>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Decorative element */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex justify-center py-8"
              >
                <Icon className={`h-32 w-32 ${colorClasses.icon}`} />
              </motion.div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                asChild
                className={`w-full h-12 font-bold text-lg ${colorClasses.button} text-white shadow-xl hover:shadow-2xl transition-all duration-300 group`}
              >
                <Link href={url}>
                  <motion.span 
                    className="flex items-center justify-center"
                    whileHover={{ x: 5 }}
                  >
                    Start Creating Now
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                </Link>
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateTileGrid() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.h2 
          className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          Create Amazing Learning Content
        </motion.h2>
        <motion.p 
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Choose your tool and start building engaging educational content in minutes
        </motion.p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {tiles.map((tile, index) => (
          <Tile
            key={index}
            {...tile}
            index={index}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center space-y-6 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-4"
        >
          <Brain className="h-8 w-8" />
        </motion.div>
        
        <h3 className="text-2xl font-bold">Need Something Custom?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Can't find what you're looking for? Our AI can help you create any type of educational content.
        </p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => window.location.href = '/contactus'}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Custom Help
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}