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
  BookMarked,
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
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

// Enhanced color system with glassmorphism
const getColorClasses = (color: string, isPremium: boolean) => {
  const colorMap = {
    blue: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 hover:from-blue-100/90 hover:via-indigo-100/90 hover:to-purple-100/90 dark:from-blue-950/80 dark:via-indigo-950/80 dark:to-purple-950/80 dark:hover:from-blue-900/90 dark:hover:via-indigo-900/90 dark:hover:to-purple-900/90 border-blue-200/50 dark:border-blue-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
    },
    green: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-green-50/80 via-emerald-50/80 to-teal-50/80 hover:from-green-100/90 hover:via-emerald-100/90 hover:to-teal-100/90 dark:from-green-950/80 dark:via-emerald-950/80 dark:to-teal-950/80 dark:hover:from-green-900/90 dark:hover:via-emerald-900/90 dark:hover:to-teal-900/90 border-green-200/50 dark:border-green-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
    },
    purple: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-purple-50/80 via-violet-50/80 to-fuchsia-50/80 hover:from-purple-100/90 hover:via-violet-100/90 hover:to-fuchsia-100/90 dark:from-purple-950/80 dark:via-violet-950/80 dark:to-fuchsia-950/80 dark:hover:from-purple-900/90 dark:hover:via-violet-900/90 dark:hover:to-fuchsia-900/90 border-purple-200/50 dark:border-purple-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-purple-600 dark:text-purple-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
    },
    orange: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-orange-50/80 via-red-50/80 to-pink-50/80 hover:from-orange-100/90 hover:via-red-100/90 hover:to-pink-100/90 dark:from-orange-950/80 dark:via-red-950/80 dark:to-pink-950/80 dark:hover:from-orange-900/90 dark:hover:via-red-900/90 dark:hover:to-pink-900/90 border-orange-200/50 dark:border-orange-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-orange-600 dark:text-orange-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
    },
    teal: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-teal-50/80 via-cyan-50/80 to-sky-50/80 hover:from-teal-100/90 hover:via-cyan-100/90 hover:to-sky-100/90 dark:from-teal-950/80 dark:via-cyan-950/80 dark:to-sky-950/80 dark:hover:from-teal-900/90 dark:hover:via-cyan-900/90 dark:hover:to-sky-900/90 border-teal-200/50 dark:border-teal-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-teal-600 dark:text-teal-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
    },
    indigo: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-indigo-50/80 via-blue-50/80 to-cyan-50/80 hover:from-indigo-100/90 hover:via-blue-100/90 hover:to-cyan-100/90 dark:from-indigo-950/80 dark:via-blue-950/80 dark:to-cyan-950/80 dark:hover:from-indigo-900/90 dark:hover:via-blue-900/90 dark:hover:to-cyan-900/90 border-indigo-200/50 dark:border-indigo-700/50",
      icon: isPremium ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400",
      button: isPremium ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
    },
    rose: {
      card: isPremium
        ? "backdrop-blur-sm bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-yellow-50/80 hover:from-amber-100/90 hover:via-orange-100/90 hover:to-yellow-100/90 dark:from-amber-950/80 dark:via-orange-950/80 dark:to-yellow-950/80 dark:hover:from-amber-900/90 dark:hover:via-orange-900/90 dark:hover:to-yellow-900/90 border-amber-200/50 dark:border-amber-700/50"
        : "backdrop-blur-sm bg-gradient-to-br from-rose-50/80 via-pink-50/80 to-purple-50/80 hover:from-rose-100/90 hover:via-pink-100/90 hover:to-purple-100/90 dark:from-rose-950/80 dark:via-pink-950/80 dark:to-purple-950/80 dark:hover:from-rose-900/90 dark:hover:via-pink-900/90 dark:hover:to-purple-900/90 border-rose-200/50 dark:border-rose-700/50",
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
  category: string;
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
    category: "assessment",
    taglines: [
      "Create quizzes for any subject",
     
      "Customize question types",
      "Track learning progress"
    ],
    isPremium: false,
    timeToCreate: "2 minutes",
    difficulty: "Easy" as const,
    benefits: [
      "Quick quiz creation",
      "Adjustable difficulty",
      "Performance tracking"
    ],
  },
  {
    icon: FileText,
    title: "Document Quiz",
    description: "Turn any PDF or document into a quiz instantly. Great for study materials.",
    url: "/dashboard/document",
    color: "orange",
    category: "assessment",
    taglines: [
      "Turn documents into quizzes",
      "Perfect for study materials",
      "Generate questions from content",
      "Works with PDFs and documents"
    ],
    isPremium: false,
    timeToCreate: "1 minute",
    difficulty: "Easy" as const,
    benefits: [
      "Convert documents to quizzes",
      "Extract key information",
      "Multiple file formats"
    ],
  },
  {
    icon: PenTool,
    title: "Essay Questions",
    description: "Create thoughtful essay questions that make you think deeper about topics.",
    url: "/dashboard/openended",
    color: "green",
    category: "assessment",
    taglines: [
      "Build questions that make you think",
      "Perfect for deeper learning",
    
      "Great for any subject level"
    ],
    isPremium: false,
    timeToCreate: "3 minutes",
    difficulty: "Medium" as const,
    benefits: [
      "Encourages deep thinking",
      "Writing practice",
      "Flexible for any subject"
    ],
  },
  {
    icon: AlignLeft,
    title: "Fill the Blanks",
    description: "Create gap-fill exercises to practice vocabulary and key concepts.",
    url: "/dashboard/blanks",
    color: "rose",
    category: "assessment",
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
      "Practice vocabulary",
      "Reinforce key concepts",
      "Adjustable difficulty"
    ],
  },
  {
    icon: BookOpen,
    title: "Course Builder",
    description: "Build complete courses with lessons, quizzes, and everything organized perfectly.",
    url: "/dashboard/create",
    color: "purple",
    category: "creation",
    taglines: [
      "Build complete courses",
      "Organize lessons and quizzes",
      "Add various content types",
      "Track student progress"
    ],
    isPremium: false,
    timeToCreate: "30 minutes",
    difficulty: "Advanced" as const,
    benefits: [
      "Organized course structure",
      "Multiple content types",
      "Progress tracking"
    ],
  },
  {
    icon: Code,
    title: "Coding Practice",
    description: "Create coding challenges that test real programming skills with instant feedback.",
    url: "/dashboard/code",
    color: "teal",
    category: "creation",
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
      "Multiple languages",
      "Code testing",
      "Realistic challenges"
    ],
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Create flashcards that learn with you and focus on what you need most.",
    url: "/dashboard/flashcard",
    color: "indigo",
    category: "study",
    taglines: [
      "Create effective flashcards",
      "Focus on what you need",
      "Better memorization",
      "Track your progress"
    ],
    isPremium: false,
    timeToCreate: "3 minutes",
    difficulty: "Easy" as const,
    benefits: [
      "Spaced repetition",
      "Focus on weak areas",
      "Create from notes"
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
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 overflow-hidden rounded-2xl flex flex-col">
          <div className="grid lg:grid-cols-2 flex-1 min-h-0">
            {/* Left side - Hero content */}
            <div className={`p-6 lg:p-8 bg-gradient-to-br ${colorClasses.card.replace('backdrop-blur-sm', '').replace('border-white/20', 'border-r')} flex flex-col`}>
              <DialogHeader className="space-y-6">
                <DialogTitle className="flex items-center justify-between">
                  <div className={`flex items-center text-4xl font-bold ${colorClasses.icon}`}>
                    <motion.div
                      initial={{ rotate: 0, scale: 0.8 }}
                      animate={{ rotate: 360, scale: 1 }}
                      transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
                    >
                      <Icon className="h-12 w-12 mr-4" />
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
                        Premium
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
                        className="text-center py-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border backdrop-blur-sm"
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

              {/* Decorative element */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex justify-center mt-8"
              >
                <Icon className={`h-32 w-32 ${colorClasses.icon}`} />
              </motion.div>
            </div>

            {/* Right side - Details */}
            <div className="p-8 overflow-y-auto flex-1">
              <div className="space-y-8">
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
                      "Pick your settings and difficulty",
                      "Click create and watch the magic",
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
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 p-6 border-t bg-muted/20 flex-shrink-0">
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
  // Group tiles by category
  const categories = {
    assessment: {
      title: "Assessment Tools",
      description: "Create quizzes and tests to evaluate learning",
      tiles: tiles.filter(tile => tile.category === "assessment")
    },
    creation: {
      title: "Content Creation",
      description: "Build courses and coding challenges",
      tiles: tiles.filter(tile => tile.category === "creation")
    },
    study: {
      title: "Study Aids",
      description: "Enhance learning with smart study tools",
      tiles: tiles.filter(tile => tile.category === "study")
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Enhanced Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 space-y-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800"
        >
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Learning Tools</span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          Create Amazing<br />Learning Content
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Transform your ideas into engaging educational experiences with our suite of AI-powered creation tools
        </motion.p>
      </motion.div>

      {/* Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-4 mb-16"
      >
        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
          <BookMarked className="h-4 w-4 mr-2" />
          By Category
        </Button>
      </motion.div>

      {/* Category-based Grid */}
      {Object.entries(categories).map(([key, category], categoryIndex) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + categoryIndex * 0.2 }}
          className="mb-16"
        >
          <motion.div
            className="text-center mb-8"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-3xl font-bold mb-2">{category.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {category.tiles.map((tile, index) => (
              <Tile
                key={`${key}-${index}`}
                {...tile}
                index={categoryIndex * 10 + index}
              />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Enhanced Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-center space-y-6 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border backdrop-blur-sm"
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