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
  Star,
  Crown,
  Zap,
  BookMarked,
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
import { getPlanConfig, isQuizTypeAvailable } from '@/types/subscription-plans';
import type { SubscriptionPlanType } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

// Use centralized Nerobrutal theme tokens for colors (visual-only changes)
const getColorClasses = (color: string, isLocked: boolean) => {
  // Map logical color names to theme variables used in the design system
  const mapToVar: Record<string, string> = {
    blue: 'primary',
    green: 'success',
    purple: 'secondary',
    orange: 'accent',
    teal: 'success',
    indigo: 'primary',
    rose: 'error',
  };

  const token = mapToVar[color] || 'primary';

  const baseCard = isLocked
    ? 'bg-[var(--color-card)] border-4 border-[var(--color-border)] opacity-80'
    : 'bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]';

  const iconClass = isLocked ? 'text-gray-400 dark:text-gray-600' : `text-[var(--color-${token})]`;
  const buttonClass = isLocked
    ? 'bg-[var(--color-muted)] border-4 border-[var(--color-border)] text-[var(--color-text)] shadow-[4px_4px_0px_0px_hsl(var(--border))]'
    : `bg-[var(--color-${token})] border-4 border-[var(--color-border)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]`;

  return { card: baseCard, icon: iconClass, button: buttonClass };
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
  featureType: FeatureType; // Add feature type for access control
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
  // Map difficulties to Nerobrutal semantic tokens
  switch (difficulty) {
    case 'Easy':
      return 'bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/50';
    case 'Medium':
      return 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/50';
    case 'Advanced':
      return 'bg-[var(--color-error)]/20 text-[var(--color-error)] border-[var(--color-error)]/50';
    default:
      return 'bg-[var(--color-muted)]/20 text-[var(--color-text)] border-[var(--color-border)]/50';
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
  requiredPlan,
  featureType,
  benefits,
  difficulty,
  quizType,
}: CreateTileGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // ✅ NEW: Use unified feature access with exploration support
  const { canAccess, isExplorable, reason, requiredPlan: accessRequiredPlan } = useFeatureAccess(featureType);
  
  // All features are explorable, but actions are gated by canAccess
  const showUpgradeBadge = !canAccess; // Show upgrade badge but keep tile interactive
  const requiredPlanConfig = getPlanConfig(accessRequiredPlan || requiredPlan);

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

  const colorClasses = getColorClasses(color, false); // Always show as accessible for exploration

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
            onClick={(e) => {
              // Always allow exploration - open details modal
              setIsOpen(true);
            }}
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
                  {showUpgradeBadge ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge variant="neutral" className={cn(neo.badge, "text-xs bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] font-semibold")}>
                            <Crown className="h-3 w-3 mr-1" />
                            {requiredPlanConfig.name}
                          </Badge>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Requires {requiredPlanConfig.name} plan to use - Click to explore!</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : requiredPlan !== 'FREE' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="neutral" className={cn(neo.badge, "text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40")}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>You have access to this feature!</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardTitle>
              
              {/* Metadata */}
              <div className="flex items-center gap-3 mt-2">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="neutral" className={cn(neo.badge, `text-xs ${getDifficultyColor(difficulty!)}`)}>
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
                <PlanAwareButton
                  label="Get Started"
                  onClick={() => router.push(url)}
                  requiredPlan={accessRequiredPlan || requiredPlan}
                  allowPublicAccess={true}
                  className={`w-full transition-all duration-300 font-semibold ${colorClasses.button} text-white shadow-lg hover:shadow-xl group`}
                />
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </TooltipProvider>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)] overflow-hidden flex flex-col">
          <div className="grid lg:grid-cols-2 flex-1 min-h-0">
            {/* Left side - Hero content */}
            <div className="p-6 lg:p-8 bg-[var(--color-bg)] border-r-4 border-[var(--color-border)] flex flex-col">
              <DialogHeader className="space-y-4 sm:space-y-6">
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
                    {showUpgradeBadge ? (
                      <Badge variant="neutral" className={cn(neo.badge, "bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))]")}> 
                        <Crown className="h-3 w-3 mr-1" />
                        {requiredPlanConfig.name} Required
                      </Badge>
                    ) : requiredPlan !== 'FREE' && (
                      <Badge variant="neutral" className={cn(neo.badge, "bg-[var(--color-success)]/20 dark:bg-[var(--color-success)]/10 text-[var(--color-success)] dark:text-[var(--color-success)] border-[var(--color-success)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))]")}> 
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                    <Badge variant="neutral" className={cn(neo.badge, getDifficultyColor(difficulty!))}>
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
                        <p className="text-lg font-medium italic px-6">
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
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
              <div className="space-y-6 sm:space-y-8">
                {/* Quick stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="text-center p-4 rounded-lg bg-muted/30 border">
                    <Target className={`h-8 w-8 mx-auto mb-2 ${colorClasses.icon}`} />
                    <div className="font-semibold">{difficulty}</div>
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30 border">
                    <Zap className={`h-8 w-8 mx-auto mb-2 ${colorClasses.icon}`} />
                    <div className="font-semibold">AI Powered</div>
                    <div className="text-sm text-muted-foreground">Instant Generation</div>
                  </div>
                </motion.div>

                {/* Key Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-bold flex items-center">
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
                  <h3 className="text-lg font-bold flex items-center">
                    <Sparkles className={`h-6 w-6 mr-3 ${colorClasses.icon}`} />
                    How It Works
                  </h3>
                  <div className="grid gap-4">
                    {[
                      "Enter your topic ",
                      "AI generates questions instantly",
                      "Review and use your creation"
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
              <PlanAwareButton
                label="Get Started"
                onClick={() => router.push(url)}
                requiredPlan={accessRequiredPlan || requiredPlan}
                allowPublicAccess={true}
                className={`w-full h-12 font-bold text-base ${colorClasses.button} text-white shadow-xl hover:shadow-2xl transition-all duration-300 group`}
              />
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
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/30 border-4 border-[var(--color-primary)]/20 shadow-[4px_4px_0px_0px_hsl(var(--border))]"
        >
          <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-primary)]">AI-Powered Learning Tools</span>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl font-bold text-foreground"
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
            <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
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
        className="text-center space-y-6 p-8 rounded-2xl bg-card border-6 border-border shadow-neo"
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4 border-6 border-primary-foreground shadow-neo"
        >
          <Brain className="h-8 w-8" />
        </motion.div>

        <h3 className="text-xl font-bold">Need Something Custom?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Can't find what you're looking for? Our AI can help you create any type of educational content.
        </p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            className="bg-primary hover:bg-accent text-white font-semibold px-8 py-3 border-6 border-primary-foreground shadow-neo hover:shadow-neo-hover neo-hover-lift"
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