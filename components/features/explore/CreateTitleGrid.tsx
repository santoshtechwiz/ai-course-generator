"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  Target,
  CheckCircle,
  ArrowRight,
  Crown,
  Zap,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { cn } from '@/lib/utils'
import neo from '@/components/neo/tokens'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import PlanAwareButton from '@/components/quiz/PlanAwareButton';
import type { FeatureType } from '@/lib/featureAccess';
import { getPlanConfig } from '@/types/subscription-plans';
import type { SubscriptionPlanType } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

// Brutal theme color system
const getBrutalColorClasses = (color: string, isLocked: boolean) => {
  const colorMap: Record<string, { 
    bg: string; 
    border: string; 
    text: string;
    accent: string;
  }> = {
    blue: { 
      bg: 'bg-blue-500', 
      border: 'border-blue-500', 
      text: 'text-blue-500',
      accent: 'bg-blue-100 dark:bg-blue-900/20'
    },
    green: { 
      bg: 'bg-green-500', 
      border: 'border-green-500', 
      text: 'text-green-500',
      accent: 'bg-green-100 dark:bg-green-900/20'
    },
    purple: { 
      bg: 'bg-purple-500', 
      border: 'border-purple-500', 
      text: 'text-purple-500',
      accent: 'bg-purple-100 dark:bg-purple-900/20'
    },
    orange: { 
      bg: 'bg-orange-500', 
      border: 'border-orange-500', 
      text: 'text-orange-500',
      accent: 'bg-orange-100 dark:bg-orange-900/20'
    },
    teal: { 
      bg: 'bg-teal-500', 
      border: 'border-teal-500', 
      text: 'text-teal-500',
      accent: 'bg-teal-100 dark:bg-teal-900/20'
    },
    indigo: { 
      bg: 'bg-indigo-500', 
      border: 'border-indigo-500', 
      text: 'text-indigo-500',
      accent: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    rose: { 
      bg: 'bg-rose-500', 
      border: 'border-rose-500', 
      text: 'text-rose-500',
      accent: 'bg-rose-100 dark:bg-rose-900/20'
    },
  };

  return colorMap[color] || colorMap.blue;
};

const getDifficultyBrutalStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-400 text-black border-4 border-black';
    case 'Medium':
      return 'bg-yellow-400 text-black border-4 border-black';
    case 'Advanced':
      return 'bg-red-500 text-white border-4 border-black';
    default:
      return 'bg-gray-400 text-black border-4 border-black';
  }
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
  requiredPlan: SubscriptionPlanType;
  featureType: FeatureType;
  benefits?: string[];
  difficulty?: "Easy" | "Medium" | "Advanced";
  quizType?: 'mcq' | 'fill-blanks' | 'open-ended' | 'code-quiz' | 'video-quiz';
}

const tiles = [
  {
    icon: FileQuestion,
    title: "Quiz Maker",
    description: "Create multiple-choice quizzes with AI-generated questions.",
    url: "/dashboard/mcq",
    color: "blue",
    category: "assessment",
    quizType: 'mcq' as const,
    requiredPlan: 'FREE' as SubscriptionPlanType,
    featureType: 'quiz-mcq' as FeatureType,
    taglines: [
      "Create quizzes for any subject",
      "AI-powered question generation",
      "Track learning progress"
    ],
    difficulty: "Easy" as const,
    benefits: [
      "Multiple-choice format",
      "Instant AI generation",
      "Free tier available"
    ],
  },
  {
    icon: FileText,
    title: "Document Quiz",
    description: "Upload PDFs and documents to generate quizzes automatically.",
    url: "/dashboard/document",
    color: "orange",
    category: "assessment",
    quizType: 'mcq' as const,
    requiredPlan: 'BASIC' as SubscriptionPlanType,
    featureType: 'pdf-generation' as FeatureType,
    taglines: [
      "Upload PDF or document",
      "AI extracts key concepts",
      "Generate quizzes instantly"
    ],
    difficulty: "Easy" as const,
    benefits: [
      "PDF & document support",
      "Auto-extract questions",
      "Requires Basic plan"
    ],
  },
  {
    icon: PenTool,
    title: "Essay Questions",
    description: "Generate open-ended essay questions for deeper learning.",
    url: "/dashboard/openended",
    color: "green",
    category: "assessment",
    quizType: 'open-ended' as const,
    requiredPlan: 'PREMIUM' as SubscriptionPlanType,
    featureType: 'quiz-openended' as FeatureType,
    taglines: [
      "Open-ended questions",
      "Critical thinking focus",
      "AI-generated prompts"
    ],
    difficulty: "Medium" as const,
    benefits: [
      "Essay-style questions",
      "Deeper understanding",
      "Any subject supported"
    ],
  },
  {
    icon: AlignLeft,
    title: "Fill the Blanks",
    description: "Create fill-in-the-blank exercises for vocabulary practice.",
    url: "/dashboard/blanks",
    color: "rose",
    category: "assessment",
    quizType: 'fill-blanks' as const,
    requiredPlan: 'BASIC' as SubscriptionPlanType,
    featureType: 'quiz-blanks' as FeatureType,
    taglines: [
      "Fill-in-the-blank format",
      "Vocabulary reinforcement",
      "AI identifies key terms"
    ],
    difficulty: "Easy" as const,
    benefits: [
      "Gap-fill exercises",
      "Vocabulary focus",
      "Premium feature"
    ],
  },
  {
    icon: BookOpen,
    title: "Course Builder",
    description: "Build structured courses with AI-generated chapters and content.",
    url: "/dashboard/create",
    color: "purple",
    category: "creation",
    quizType: 'video-quiz' as const,
    requiredPlan: 'PREMIUM' as SubscriptionPlanType,
    featureType: 'course-creation' as FeatureType,
    taglines: [
      "Full course creation",
      "AI-generated chapters",
      "Structured learning paths"
    ],
    difficulty: "Advanced" as const,
    benefits: [
      "Complete course structure",
      "Video & text content",
      "Progress tracking included"
    ],
  },
  {
    icon: Code,
    title: "Coding Practice",
    description: "Generate coding challenges with AI for programming practice.",
    url: "/dashboard/code",
    color: "teal",
    category: "creation",
    quizType: 'code-quiz' as const,
    requiredPlan: 'ENTERPRISE' as SubscriptionPlanType,
    featureType: 'quiz-code' as FeatureType,
    taglines: [
      "Coding challenge generation",
      "Multiple languages supported",
      "Enterprise-level feature"
    ],
    difficulty: "Medium" as const,
    benefits: [
      "Programming exercises",
      "Multi-language support",
      "Enterprise plan required"
    ],
  },
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "AI-powered flashcards for effective memorization and review.",
    url: "/dashboard/flashcard",
    color: "indigo",
    category: "study",
    quizType: 'mcq' as const,
    requiredPlan: 'BASIC' as SubscriptionPlanType,
    featureType: 'quiz-flashcard' as FeatureType,
    taglines: [
      "AI-generated flashcards",
      "Spaced repetition system",
      "Quick memorization"
    ],
    difficulty: "Easy" as const,
    benefits: [
      "Flashcard format",
      "AI content generation",
      "Study mode included"
    ],
  },
  {
    icon: Target,
    title: "Ordering Quiz",
    description: "Master sequences with AI-generated ordering and sequencing challenges.",
    url: "/dashboard/ordering",
    color: "rose",
    category: "assessment",
    quizType: 'mcq' as const,
    requiredPlan: 'FREE' as SubscriptionPlanType,
    featureType: 'quiz-ordering' as FeatureType,
    taglines: [
      "Order sequences correctly",
      "Logic & sequence thinking",
      "Instant feedback"
    ],
    difficulty: "Medium" as const,
    benefits: [
      "Ordering challenges",
      "Process learning",
      "Daily quiz limits"
    ],
  },
];

// Brutal animation variants - more direct, less floaty
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: index * 0.05,
      ease: "easeOut"
    }
  }),
};

function Tile({
  icon: Icon,
  title,
  description,
  url,
  index,
  taglines,
  color,
  requiredPlan,
  featureType,
  benefits,
  difficulty,
  quizType,
}: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const { canAccess, isExplorable, reason, requiredPlan: accessRequiredPlan } = useFeatureAccess(featureType);
  const showUpgradeBadge = !canAccess;
  const requiredPlanConfig = getPlanConfig(accessRequiredPlan || requiredPlan);
  const colorClasses = getBrutalColorClasses(color, false);

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

  return (
    <>
      <TooltipProvider>
        <motion.div
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="h-full"
        >
          <Card
            className={cn(
              "h-full flex flex-col justify-between",
              "bg-[var(--color-card)] border-6 border-[var(--color-border)] rounded-lg",
              "shadow-[3px_3px_0_var(--shadow-color)] transition-all duration-200",
              "hover:translate-x-1 hover:translate-y-1",
              "hover:shadow-[5px_5px_0_var(--shadow-color)] cursor-pointer",
              "neo-hover-lift overflow-hidden dark:bg-[var(--color-card)] dark:border-[var(--color-border)]"
            )}
            onClick={() => setIsOpen(true)}
          >
            {/* Color Strip Accent */}
            <div className={cn("h-2", colorClasses.bg)} />

            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg font-bold">
                <div className="flex items-center min-w-0 flex-1">
                  {/* Brutal Icon Container */}
                  <div className={cn(
                    "flex-shrink-0 mr-3 p-2 rounded-lg border-4 border-[var(--color-border)]",
                    "bg-[var(--color-primary)] text-[var(--color-bg)]",
                    "shadow-[3px_3px_0_var(--shadow-color)]"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="truncate font-bold text-[var(--color-text)]">{title}</span>
                </div>

                {/* Badge System */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {showUpgradeBadge ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="neutral" 
                          className="text-xs bg-yellow-400 text-black border-4 border-[var(--color-border)] font-bold uppercase px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          {requiredPlanConfig.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] bg-[var(--color-card)] text-[var(--color-text)]">
                        <p className="font-bold">Requires {requiredPlanConfig.name} - Click to explore!</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : requiredPlan !== 'FREE' && (
                    <Badge 
                      variant="neutral" 
                      className="text-xs bg-green-400 text-black border-4 border-[var(--color-border)] font-bold uppercase px-2 py-1 shadow-[2px_2px_0_var(--shadow-color)]"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardTitle>

              {/* Difficulty Badge */}
              <div className="flex items-center gap-2 mt-3">
                <Badge 
                  variant="neutral" 
                  className={cn(
                    "text-xs font-bold uppercase px-3 py-1",
                    getDifficultyBrutalStyle(difficulty!)
                  )}
                >
                  <Target className="h-3 w-3 mr-1" />
                  {difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="py-2 flex-1">
              <p className="text-sm text-[var(--color-muted)] leading-relaxed font-medium">
                {description}
              </p>
            </CardContent>

            <CardFooter className="pt-4">
              <Button
                className={cn(
                  "w-full font-bold border-4 border-[var(--color-border)] rounded-lg",
                  "shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)]",
                  "transition-all duration-200",
                  "hover:translate-x-1 hover:translate-y-1",
                  "neo-hover-lift group bg-[var(--color-primary)] text-[var(--color-bg)]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(url);
                }}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </TooltipProvider>

      {/* Brutal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn(
          "sm:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0",
          "border-6 border-[var(--color-border)] rounded-lg shadow-[6px_6px_0_var(--shadow-color)]",
          "bg-[var(--color-card)] dark:bg-[var(--color-card)] overflow-hidden flex flex-col"
        )}>
          {/* Mobile Close */}
          <div className="lg:hidden absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className={cn(
                "h-8 w-8 rounded-lg border-4 border-[var(--color-border)]",
                "bg-[var(--color-card)] hover:bg-[var(--color-bg)]",
                "text-[var(--color-text)] shadow-[3px_3px_0_var(--shadow-color)]",
                "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_var(--shadow-color)]"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 flex-1 min-h-0">
            {/* Left Panel - Hero */}
            <div className={cn(
              "p-6 lg:p-8 border-r-6 border-[var(--color-border)]",
              "flex flex-col bg-[var(--color-bg)] dark:bg-[var(--color-bg)]"
            )}>
              <DialogHeader className="space-y-4">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center text-2xl font-black">
                    <div className={cn(
                      "p-3 rounded-lg border-4 border-[var(--color-border)] mr-4",
                      "bg-[var(--color-primary)] text-[var(--color-bg)]",
                      "shadow-[3px_3px_0_var(--shadow-color)]"
                    )}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="text-xl lg:text-2xl text-[var(--color-text)]">{title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showUpgradeBadge ? (
                      <Badge className="text-xs bg-yellow-400 text-black border-4 border-[var(--color-border)] font-bold uppercase shadow-[2px_2px_0_var(--shadow-color)]">
                        <Crown className="h-3 w-3 mr-1" />
                        {requiredPlanConfig.name}
                      </Badge>
                    ) : requiredPlan !== 'FREE' && (
                      <Badge className="text-xs bg-green-400 text-black border-4 border-[var(--color-border)] font-bold uppercase shadow-[2px_2px_0_var(--shadow-color)]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    <Badge className={cn(
                      "text-xs font-bold uppercase shadow-[2px_2px_0_var(--shadow-color)]",
                      getDifficultyBrutalStyle(difficulty!)
                    )}>
                      {difficulty}
                    </Badge>
                  </div>
                </DialogTitle>

                <DialogDescription asChild>
                  <div className="space-y-6">
                    {/* Rotating Taglines - Brutal Style */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTagline}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "text-center py-6 rounded-lg",
                          "border-4 border-[var(--color-border)] bg-[var(--color-card)]",
                          "shadow-[4px_4px_0_var(--shadow-color)]"
                        )}
                      >
                        <p className="text-lg font-bold px-6 text-[var(--color-text)]">
                          "{taglines[currentTagline]}"
                        </p>
                        <div className="flex justify-center mt-4 space-x-2">
                          {taglines.map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-3 w-3 border-2 border-[var(--color-border)] transition-colors",
                                i === currentTagline ? "bg-[var(--color-primary)]" : 'bg-[var(--color-muted)]'
                              )}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <p className="text-base text-[var(--color-text)] font-medium leading-relaxed text-center">
                      {description}
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Large Icon Display */}
              <div className="flex justify-center mt-8 opacity-10">
                <Icon className={cn("h-32 w-32 text-[var(--color-primary)]")} />
              </div>
            </div>

            {/* Right Panel - Details */}
            <div className="p-6 lg:p-8 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Stats Grid - Brutal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={cn(
                    "text-center p-4 rounded-lg border-4 border-[var(--color-border)]",
                    "bg-[var(--color-card)] shadow-[3px_3px_0_var(--shadow-color)]"
                  )}>
                    <Target className={cn("h-8 w-8 mx-auto mb-2 text-[var(--color-primary)]")} />
                    <div className="text-base font-black text-[var(--color-text)]">{difficulty}</div>
                    <div className="text-sm font-bold text-[var(--color-muted)]">Level</div>
                  </div>
                  <div className={cn(
                    "text-center p-4 rounded-lg border-4 border-[var(--color-border)]",
                    "bg-[var(--color-card)] shadow-[3px_3px_0_var(--shadow-color)]"
                  )}>
                    <Zap className={cn("h-8 w-8 mx-auto mb-2 text-[var(--color-primary)]")} />
                    <div className="text-base font-black text-[var(--color-text)]">AI</div>
                    <div className="text-sm font-bold text-[var(--color-muted)]">Powered</div>
                  </div>
                </div>

                {/* Benefits - Brutal List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center text-[var(--color-text)]">
                    <CheckCircle className={cn("h-6 w-6 mr-3 text-[var(--color-primary)]")} />
                    What You Get
                  </h3>
                  <div className="space-y-2">
                    {benefits?.map((benefit, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center p-3 rounded-lg",
                          "border-4 border-[var(--color-border)] bg-[var(--color-card)]",
                          "shadow-[2px_2px_0_var(--shadow-color)]"
                        )}
                      >
                        <CheckCircle className={cn("h-5 w-5 mr-3 flex-shrink-0 text-[var(--color-primary)]")} />
                        <span className="text-sm font-bold text-[var(--color-text)]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

          
              </div>
            </div>
          </div>

          <DialogFooter className={cn(
            "p-6 border-t-6 border-[var(--color-border)]",
            "bg-[var(--color-bg)] dark:bg-[var(--color-bg)]"
          )}>
            <Button
              onClick={() => router.push(url)}
              className={cn(
                "w-full h-12 font-black text-base border-4 border-[var(--color-border)] rounded-lg",
                "shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)]",
                "transition-all duration-200",
                "hover:translate-x-1 hover:translate-y-1",
                "group bg-[var(--color-primary)] text-[var(--color-bg)]",
                "hover:bg-[var(--color-primary)]"
              )}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateTileGrid() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Brutal Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12 space-y-6"
      >
        {/* Badge */}
        <div className={cn(
          "inline-flex items-center gap-3 px-6 py-3 rounded-lg",
          "bg-[var(--color-primary)] border-4 border-[var(--color-border)]",
          "shadow-[3px_3px_0_var(--shadow-color)] text-[var(--color-bg)] font-bold"
        )}>
          <Sparkles className="h-5 w-5" />
          <span className="text-sm uppercase tracking-wide">AI-Powered Tools</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-text)]">
          Create Amazing<br />Learning Content
        </h1>

        {/* Description */}
        <p className="text-xl text-[var(--color-muted)] max-w-3xl mx-auto font-bold">
          Transform your ideas into engaging educational experiences
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tiles.map((tile, index) => (
            <Tile key={tile.url} {...tile} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Footer CTA - Brutal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          "text-center space-y-6 p-8 rounded-lg",
          "bg-[var(--color-card)] border-6 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)]"
        )}
      >
        <div className={cn(
          "inline-flex items-center justify-center w-16 h-16 rounded-full",
          "bg-[var(--color-primary)] border-4 border-[var(--color-border)] text-[var(--color-bg)] shadow-[3px_3px_0_var(--shadow-color)]"
        )}>
          <Brain className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-black text-[var(--color-text)]">Need Something Custom?</h3>
        <p className="text-base text-[var(--color-muted)] font-bold max-w-md mx-auto">
          Can't find what you're looking for? Get custom help from our team.
        </p>

        <Button
          size="lg"
          className={cn(
            "bg-[var(--color-primary)] text-[var(--color-bg)] font-black px-8 py-3 border-4 border-[var(--color-border)] rounded-lg",
            "shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)]",
            "transition-all duration-200",
            "hover:translate-x-1 hover:translate-y-1"
          )}
          onClick={() => window.location.href = '/contactus'}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Get Custom Help
        </Button>
      </motion.div>
    </section>
  );
}