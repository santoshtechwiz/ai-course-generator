"use client"

import React, { useEffect, useState, memo, useCallback } from "react"
import { FileQuestion, AlignJustify, PenTool, Code, Filter, X, ChevronDown, Flashlight, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SearchBar } from "./SearchBar"
import type { QuizType } from "@/app/types/quiz-types"

// Local helper mapping for quiz types
const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion },
  { id: "openended" as const, label: "Open Ended", icon: AlignJustify },
  { id: "blanks" as const, label: "Fill in the Blanks", icon: PenTool },
  { id: "code" as const, label: "Code", icon: Code },
  { id: "flashcard" as const, label: "Flash Cards", icon: Flashlight },
]

interface QuizSidebarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
  selectedTypes: QuizType[]
  toggleQuizType: (type: QuizType) => void
  questionCountRange?: [number, number]
  onQuestionCountChange?: (range: [number, number]) => void
  showPublicOnly?: boolean
  onPublicOnlyChange?: (value: boolean) => void
}

function QuizSidebarComponent({
  search,
  onSearchChange,
  onClearSearch,
  isSearching,
  selectedTypes,
  toggleQuizType,
  questionCountRange = [0, 50],
  onQuestionCountChange,
  showPublicOnly = false,
  onPublicOnlyChange,
}: QuizSidebarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isRendered, setIsRendered] = useState(false)
  const [localQuestionCount, setLocalQuestionCount] = useState<[number, number]>(questionCountRange)

  // Safely handle window measurements with mounting state to prevent white screen
  useEffect(() => {
    try {
      setIsMounted(true)
      const handleResize = () => {
        if (typeof window !== "undefined") {
          setIsDesktop(window.innerWidth >= 1024)
        }
      }
      
      handleResize() // Initial check
      
      // Set rendered state after a small delay to allow React to render once
      const renderTimer = setTimeout(() => setIsRendered(true), 50)

      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
        clearTimeout(renderTimer)
      }
    } catch (error) {
      console.error("Error setting up QuizSidebar:", error)
      // Ensure component still renders even if there's an error
      setIsMounted(true)
      setIsRendered(true)
      setIsDesktop(false)
    }
  }, [])

  useEffect(() => {
    setLocalQuestionCount(questionCountRange)
  }, [questionCountRange])

  const handleQuestionCountChange = useCallback(
    (value: number[]) => {
      if (value.length >= 2) {
        setLocalQuestionCount([value[0], value[1]])
        const timer = setTimeout(() => {
          onQuestionCountChange?.([value[0], value[1]])
        }, 300)
        return () => clearTimeout(timer)
      }
    },
    [onQuestionCountChange],
  )

  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }
  
  // Return skeleton during initial mounting to prevent white screen
  if (!isMounted) {
    return <SidebarSkeleton />
  }

  // Mobile filter panel with animation and backdrop
  const renderMobileFilterPanel = () => (
    <AnimatePresence>
      {showMobileFilters && (
        <>
          {/* Semi-transparent backdrop */}
          <motion.div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
          />
          
          {/* Filter panel */}
          <motion.div 
            className="fixed bottom-0 inset-x-0 bg-card shadow-lg rounded-t-xl z-50 p-4 pb-8 border border-border max-h-[80vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Quizzes
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6">
              {renderFilters()}
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowMobileFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <motion.div
      className="space-y-6 lg:w-1/4 lg:sticky lg:top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      style={{ opacity: isRendered ? 1 : 0.5 }}
    >
      {/* Desktop Search */}
      <motion.div className="hidden lg:block" variants={itemVariants}>
        <SearchBar
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          isSearching={isSearching}
        />
      </motion.div>

      {/* Mobile Search and Filter Toggle */}
      <motion.div className="lg:hidden space-y-4" variants={itemVariants}>
        <SearchBar
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          isSearching={isSearching}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="border-dashed w-full justify-between group transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 group-hover:text-primary transition-colors" />
            {showMobileFilters ? "Hide Filters" : "Show Filters"}
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ease-in-out ${showMobileFilters ? "rotate-180" : ""}`}
          />
          {selectedTypes.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs animate-pulse">
              {selectedTypes.length}
            </span>
          )}
        </Button>

        {(selectedTypes.length > 0 || search.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        )}
      </motion.div>

      {/* Filter Panel */}
      {renderMobileFilterPanel()}
      <AnimatePresence>
        {(showMobileFilters || isDesktop) && (
          <motion.div
            className="space-y-5 bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, overflow: "visible" }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Filter by Type */}
            <motion.div className="flex justify-between items-center" variants={itemVariants}>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Filter by Type</span>
              </h3>
              {selectedTypes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedTypes.forEach(toggleQuizType)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-xs hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </motion.div>
            <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2" variants={itemVariants}>
              {quizTypes.map((type) => {
                const isSelected = selectedTypes.includes(type.id)
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => toggleQuizType(type.id)}
                    className={`transition-all duration-200 flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium border ${
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                    }`}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={isSelected}
                  >
                    <type.icon
                      className={`h-4 w-4 ${
                        isSelected
                          ? "text-white"
                          : type.id === "mcq"
                            ? "text-blue-600 dark:text-blue-300"
                            : type.id === "openended"
                              ? "text-green-600 dark:text-green-300"
                              : type.id === "blanks"
                                ? "text-yellow-600 dark:text-yellow-300"
                                : type.id === "code"
                                  ? "text-purple-600 dark:text-purple-300"
                                  : "text-orange-600 dark:text-orange-300"
                      }`}
                    />
                    <span className="break-words">{type.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
            {/* Question Count */}
            {onQuestionCountChange && (
              <motion.div className="pt-4 space-y-3" variants={itemVariants}>
                <Separator className="my-4" />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-primary" />
                  Question Count
                </h3>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={50}
                    step={1}
                    value={[localQuestionCount[0], localQuestionCount[1]]}
                    onValueChange={handleQuestionCountChange}
                    className="my-6"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{localQuestionCount[0]} questions</span>
                    <span>{localQuestionCount[1]} questions</span>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Public Switch */}
            {onPublicOnlyChange && (
              <motion.div className="pt-4" variants={itemVariants}>
                <Separator className="my-4" />
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="public-only" className="flex items-center gap-2 cursor-pointer">
                    <Badge variant="outline" className="font-normal">
                      Public
                    </Badge>
                    <span>Show public quizzes only</span>
                  </Label>
                  <Switch id="public-only" checked={showPublicOnly} onCheckedChange={onPublicOnlyChange} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Separated skeleton component for better readability
function SidebarSkeleton() {
  return (
    <div className="space-y-6 lg:w-1/4 lg:sticky lg:top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 animate-pulse"></div>
      <div className="space-y-2 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" 
            style={{ 
              animationDelay: `${i * 100}ms`,
              animationDuration: `${800 + i * 100}ms`
            }}
          ></div>
        ))}
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 mt-6 animate-pulse" 
           style={{animationDelay: "600ms"}}></div>
    </div>
  )
}

// ErrorBoundary wrapper component to prevent white screen on error
class QuizSidebarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("QuizSidebar error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-6 lg:w-1/4 lg:sticky lg:top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="p-4 text-center">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">Unable to display filters</p>
            <Button variant="outline" size="sm" onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reload
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function QuizSidebarWithErrorHandling(props: QuizSidebarProps) {
  return (
    <QuizSidebarErrorBoundary>
      <QuizSidebarComponent {...props} />
    </QuizSidebarErrorBoundary>
  );
}

export const QuizSidebar = memo(QuizSidebarWithErrorHandling)
