"use client"

import { type ReactNode, useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/tailwindUtils"
import { HelpCircle, Sparkles, X, Zap, Brain } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RandomQuiz } from "./layouts/RandomQuiz"
import { PageHeader } from "./PageHeader"
import { FeaturedQuiz } from "./FeaturedQuiz"

interface QuizCreateLayoutProps {
  children: ReactNode
  title: string
  description?: string
  helpText?: string
  icon?: ReactNode
  className?: string
  sidebarEnabled?: boolean
  headerVariant?: "default" | "centered" | "minimal"
  contentSpacing?: "sm" | "md" | "lg"
  mobileSidebarVariant?: "drawer" | "bottom-sheet" | "hidden"
  reduceMotion?: boolean
}

const contentSpacingClasses = {
  sm: "gap-6 py-6",
  md: "gap-8 py-8",
  lg: "gap-12 py-12",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: "easeOut",
    },
  },
}

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const QuizCreateLayout = ({
  children,
  title,
  description,
  helpText,
  icon,
  className,
  sidebarEnabled = true,
  headerVariant = "default",
  contentSpacing = "md",
  mobileSidebarVariant = "drawer",
  reduceMotion = false,
}: QuizCreateLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches || reduceMotion)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches || reduceMotion)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [reduceMotion])

  const sidebar = useMemo(() => {
    if (!sidebarEnabled) return null
    return (
      <motion.aside
        className="h-full flex flex-col min-h-0 lg:h-[calc(100vh-120px)] lg:max-h-[calc(100vh-120px)] overflow-hidden"
        variants={contentVariants}
      >
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
     

          {/* Enhanced Featured Quiz */}
          <div className="flex-shrink-0 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="max-h-[300px] overflow-hidden">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-60"></div>
                <div className="relative">
                  <FeaturedQuiz
                    className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/20 dark:to-pink-950/20 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-800/50"
                    enableSkeleton={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    )
  }, [sidebarEnabled])

  // Enhanced mobile sidebar toggle
  const mobileSidebarToggle =
    sidebarEnabled && mobileSidebarVariant !== "hidden" ? (
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileSidebarOpen(true)}
          className={cn(
            "fixed top-4 right-4 z-40 rounded-full",
            "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md",
            "border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700",
            "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
            "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
          )}
          aria-label="Open AI assistant"
        >
          <Brain className="w-4 h-4" />
        </Button>
      </div>
    ) : null

  // Enhanced help tooltip
  const actionElement = helpText ? (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50",
              "border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700",
              "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
              "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
            )}
            aria-label="Get help with AI assistance"
          >
            <div className="relative">
              <HelpCircle className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className={cn(
            "max-w-xs p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
            "shadow-2xl border border-blue-200/50 dark:border-blue-800/50",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-900 dark:text-blue-100">AI Assistant</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {helpText.length > 120 ? `${helpText.substring(0, 120)}...` : helpText}
            </p>
            {helpText.length > 120 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Click for detailed guidance</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null

  return (
    <motion.div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20",
        "dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10",
        "relative overflow-hidden",
        className,
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />

      {/* AI-themed floating elements */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-indigo-400/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-purple-400/8 via-pink-400/8 to-blue-400/8 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Mobile sidebar toggle */}
      {mobileSidebarToggle}

      {/* Enhanced Mobile sidebar drawer */}
      {sidebarEnabled && mobileSidebarVariant === "drawer" && (
        <Dialog open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <DialogContent className="sm:max-w-md h-[90vh] p-0 gap-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-blue-200/50 dark:border-blue-800/50">
            <DialogHeader className="p-4 pb-2 border-b border-blue-200/30 dark:border-blue-800/30">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                    AI Quiz Tools
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-4 pt-0">{sidebar}</div>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced Header Section */}
      <header className="relative z-10 w-full border-b border-blue-200/30 dark:border-blue-800/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5" />
        <div className="relative">
          <PageHeader
            title={title}
            description={description}
            icon={
              icon || (
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              )
            }
            actionElement={actionElement}
            variant={headerVariant}
            showBackground={false}
            className="py-8 md:py-12"
          />
        </div>
      </header>

      {/* Enhanced Main Content Section */}
      <main className="relative z-10 flex-1 w-full overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <motion.div
            className={cn(
              "flex flex-col h-full",
              contentSpacingClasses[contentSpacing],
              sidebarEnabled ? "lg:flex-row lg:items-start lg:gap-8" : "max-w-5xl mx-auto",
            )}
            variants={contentVariants}
          >
            {/* Enhanced Main Content */}
            <motion.section
              className={cn("flex-1 min-w-0 overflow-y-auto", sidebarEnabled ? "lg:w-0" : "w-full")}
              variants={contentVariants}
            >
              <div className="space-y-8 pb-16 md:pb-24">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl blur-xl"></div>
                  <div className="relative">{children}</div>
                </div>
              </div>
            </motion.section>

            {/* Desktop Sidebar */}
            {sidebar && sidebarEnabled && (
              <div className="hidden lg:block lg:w-[360px] lg:flex-shrink-0">{sidebar}</div>
            )}
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}

export default QuizCreateLayout
