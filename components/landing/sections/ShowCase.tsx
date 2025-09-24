"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useInView, useAnimation } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Filter,
  AlertCircle,
  Pause,
  Play,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { FeedbackButton } from "@/components/ui/feedback-button"
import { useMobile } from "@/hooks"

// Types based on the API response
interface CourseQuizCard {
  id: string
  name: string
  slug: string
  description: string
  tagline: string
  type: "course" | "quiz"
  quizType?: "mcq" | "openended" | "blanks" | "code"
}

interface CourseQuizCardProps {
  product: CourseQuizCard
  isActive: boolean
  theme: string | undefined
}

const useCourseQuiz = () => {
  const [products, setProducts] = useState<CourseQuizCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch("/api/carousel-items")
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        const data = await response.json()
        setProducts(data)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products. Please try again.")
        setIsLoading(false)

        if (retryCount >= 2) {
          setProducts(mockProducts)
          setIsLoading(false)
        }
      }
    }

    fetchProducts()
  }, [retryCount])

  const retryFetch = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  return { products, isLoading, error, retryFetch }
}

// Optimize the useAutoplay hook to reduce unnecessary renders
const useAutoplay = (itemCount: number, initialDelay = 5000) => {
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [delay, setDelay] = useState(initialDelay)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const itemCountRef = useRef(itemCount)

  // Update the ref when itemCount changes
  useEffect(() => {
    itemCountRef.current = itemCount
  }, [itemCount])

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayEnabled((prev) => !prev)
  }, [])

  const goToNext = useCallback(() => {
    if (itemCountRef.current <= 1) return
    setCurrentIndex((prev) => (prev + 1) % itemCountRef.current)
  }, [])

  const goToPrev = useCallback(() => {
    if (itemCountRef.current <= 1) return
    setCurrentIndex((prev) => (prev - 1 + itemCountRef.current) % itemCountRef.current)
  }, [])

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < itemCountRef.current) {
      setCurrentIndex(index)
    }
  }, [])

  // Reset index when itemCount changes
  useEffect(() => {
    if (currentIndex >= itemCount) {
      setCurrentIndex(0)
    }
  }, [itemCount, currentIndex])

  // Handle autoplay timer
  useEffect(() => {
    if (!isAutoplayEnabled || itemCountRef.current <= 1) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setTimeout(goToNext, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isAutoplayEnabled, currentIndex, delay, goToNext])

  return {
    currentIndex,
    isAutoplayEnabled,
    toggleAutoplay,
    goToNext,
    goToPrev,
    goToIndex,
    setDelay,
  }
}

const ProductGallery = () => {
  const { products, isLoading, error, retryFetch } = useCourseQuiz()
  const [filter, setFilter] = useState<"all" | "course" | "quiz">("all")
  const [filteredProducts, setFilteredProducts] = useState<CourseQuizCard[]>([])
  const { theme } = useTheme()

  const containerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3, margin: "100px" })
  const controls = useAnimation()

  const {
    currentIndex: activeIndex,
    isAutoplayEnabled,
    toggleAutoplay,
    goToNext: nextProduct,
    goToPrev: prevProduct,
    goToIndex: setActiveIndex,
  } = useAutoplay(filteredProducts.length)

  useEffect(() => {
    if (filter === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((product) => product.type === filter))
    }
  }, [filter, products])

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else {
      controls.start("hidden")
    }
  }, [isInView, controls])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keyboard shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }
      
      if (e.key === "ArrowRight") {
        nextProduct()
      } else if (e.key === "ArrowLeft") {
        prevProduct()
      } else if (e.key === " ") {
        toggleAutoplay()
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextProduct, prevProduct, toggleAutoplay])

  const handleMouseEnter = useCallback(() => {
    if (isAutoplayEnabled) {
      toggleAutoplay()
    }
  }, [isAutoplayEnabled, toggleAutoplay])

  const handleMouseLeave = useCallback(() => {
    if (!isAutoplayEnabled) {
      toggleAutoplay()
    }
  }, [isAutoplayEnabled, toggleAutoplay])

  // Simulate async navigation for feedback
  const handlePrevProduct = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    prevProduct()
    return true
  }

  const handleNextProduct = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    nextProduct()
    return true
  }

  const handleToggleAutoplay = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    toggleAutoplay()
    return true
  }

  const handleDotClick = async (index: number) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    setActiveIndex(index)
    return true
  }

  return (
    <div
      className="container max-w-6xl mx-auto px-4 md:px-6"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          AI-Powered Learning Solutions
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Explore Our Course & Quiz Creator
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Discover how our AI transforms videos into interactive courses and adaptive quizzes tailored to your specific
          learning objectives
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <Tabs
            defaultValue="all"
            value={filter}
            onValueChange={(value) => setFilter(value as "all" | "course" | "quiz")}
            className="w-full max-w-md"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all" className="rounded-full">
                All
              </TabsTrigger>
              <TabsTrigger value="course" className="rounded-full">
                Course Creator
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-full">
                Quiz Generator
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>

      {/* Remove LoadingState usage and rely on global loader */}
      {error ? (
        <ErrorState error={error} onRetry={retryFetch} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState onReset={() => setFilter("all")} />
      ) : (
        <div className="relative">
          <NavigationButtons
            onPrev={handlePrevProduct}
            onNext={handleNextProduct}
            disabled={filteredProducts.length <= 1}
          />

          <motion.div
            className="absolute top-0 right-0 z-10 m-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <FeedbackButton
              variant="outline"
              size="icon"
              onClick={toggleAutoplay}
              onClickAsync={handleToggleAutoplay}
              className="rounded-full bg-background/80 backdrop-blur-sm"
              aria-label={isAutoplayEnabled ? "Pause autoplay" : "Start autoplay"}
              showIcon={false}
              feedbackDuration={500}
            >
              {isAutoplayEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </FeedbackButton>
          </motion.div>

          <div
            className="overflow-hidden rounded-2xl bg-card/30 backdrop-blur-sm border border-border/10 shadow-lg"
            style={{ perspective: "1500px" }}
            ref={carouselRef}
          >
            <div className="relative" style={{ height: "500px" }}>
              <AnimatePresence mode="wait">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={`${product.id}-${index}`}
                    initial={{ opacity: 0, rotateY: index > activeIndex ? 60 : -60, scale: 0.8 }}
                    animate={{
                      opacity: index === activeIndex ? 1 : 0,
                      rotateY: 0,
                      scale: 1,
                      zIndex: index === activeIndex ? 1 : 0,
                    }}
                    exit={{
                      opacity: 0,
                      rotateY: index < activeIndex ? -60 : 60,
                      scale: 0.8,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 30,
                      opacity: { duration: 0.5 },
                    }}
                    className={cn(
                      "absolute inset-0 w-full h-full",
                      index === activeIndex ? "pointer-events-auto" : "pointer-events-none",
                    )}
                    style={{
                      display: Math.abs(index - activeIndex) <= 1 ? "block" : "none",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <ProductCard product={product} isActive={index === activeIndex} theme={theme} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <ProgressBar
            totalItems={filteredProducts.length}
            currentIndex={activeIndex}
            isAutoplayEnabled={isAutoplayEnabled}
          />

          <div className="flex justify-center mt-8 space-x-2">
            {filteredProducts.map((_, index) => (
              <DotIndicator
                key={`dot-${index}`}
                isActive={index === activeIndex}
                onClick={() => handleDotClick(index)}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md p-6">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">{error}</p>
      <FeedbackButton
        variant="default"
        onClick={onRetry}
        onClickAsync={async () => {
          await new Promise((resolve) => setTimeout(resolve, 800))
          onRetry()
          return true
        }}
        loadingText="Retrying..."
        successText="Loading content"
        className="rounded-full"
      >
        Try Again
      </FeedbackButton>
    </motion.div>
  </div>
)

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md p-6">
      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">No AI content found matching your filter.</p>
      <FeedbackButton
        variant="outline"
        onClick={onReset}
        onClickAsync={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500))
          onReset()
          return true
        }}
        loadingText="Loading all"
        successText="Showing all"
        className="rounded-full"
      >
        Show All Content
      </FeedbackButton>
    </motion.div>
  </div>
)

const NavigationButtons = ({
  onPrev,
  onNext,
  disabled,
}: {
  onPrev: () => Promise<boolean>
  onNext: () => Promise<boolean>
  disabled: boolean
}) => (
  <>
    <div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
      <motion.div
        whileHover={{ scale: 1.1, x: -3 }}
        whileTap={{ scale: 0.95 }}
        className={disabled ? "opacity-50" : ""}
      >
        <FeedbackButton
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
          onClickAsync={onPrev}
          disabled={disabled}
          aria-label="Previous product"
          showIcon={false}
          feedbackDuration={500}
        >
          <ChevronLeft className="h-5 w-5" />
        </FeedbackButton>
      </motion.div>
    </div>

    <div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10">
      <motion.div whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.95 }} className={disabled ? "opacity-50" : ""}>
        <FeedbackButton
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
          onClickAsync={onNext}
          disabled={disabled}
          aria-label="Next product"
          showIcon={false}
          feedbackDuration={500}
        >
          <ChevronRight className="h-5 w-5" />
        </FeedbackButton>
      </motion.div>
    </div>
  </>
)

const ProgressBar = ({
  totalItems,
  currentIndex,
  isAutoplayEnabled,
}: {
  totalItems: number
  currentIndex: number
  isAutoplayEnabled: boolean
}) => {
  const progress = ((currentIndex + 1) / totalItems) * 100

  return (
    <div
      className="mt-6 relative h-1 bg-muted rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-primary"
        initial={{ width: 0 }}
        animate={{
          width: `${progress}%`,
          transition: {
            duration: isAutoplayEnabled ? 5 : 0.5,
            ease: isAutoplayEnabled ? "linear" : [0.16, 1, 0.3, 1],
          },
        }}
      />
    </div>
  )
}

const DotIndicator = ({
  isActive,
  onClick,
  index,
}: {
  isActive: boolean
  onClick: () => Promise<boolean>
  index: number
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onClick()
      setIsLoading(false)
      return true
    } catch (error) {
      setIsLoading(false)
      return false
    }
  }

  return (
    <motion.button
      className={`w-2.5 h-2.5 rounded-full transition-colors relative ${isActive ? "bg-primary" : "bg-muted"}`}
      onClick={() => handleClick()}
      aria-label={`Go to product ${index + 1}`}
      whileHover={{ scale: 1.6 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      disabled={isLoading}
    >
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-xs">...</span>
        </motion.div>
      )}
    </motion.button>
  )
}

const APPLE_EASING = [0.17, 0.67, 0.83, 0.67]

const ProductCard = ({ product, isActive, theme }: CourseQuizCardProps) => {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const isMobile = useMobile()
  

  const handleNavigation = async () => {
    setIsNavigating(true)
    try {
  
      await new Promise((resolve) => setTimeout(resolve, 800))      // Fix navigation to go to create pages instead
      if (product.type === "course") {
        router.push(`/dashboard/create`)
      } else if (product.type === "quiz" && product.quizType) {
        router.push(`/dashboard/create/${product.quizType == "blanks" ? "blanks" : product.quizType}`)
      }

      return true
    } catch (error) {
      console.error("Navigation error:", error)
      return false
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 md:p-8 h-full">
      <div className="order-2 md:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: APPLE_EASING }} // Reduced from 0.6
        >
          <div className="flex items-center mb-4 flex-wrap gap-2">
            <Badge variant={product.type === "course" ? "default" : "secondary"} className="rounded-full mr-2">
              {product.type === "course" ? "Course Creator" : "Quiz Generator"}
            </Badge>

            {product.quizType && (
              <Badge variant="outline" className="rounded-full">
                {product.quizType === "mcq"
                  ? "Multiple Choice"
                  : product.quizType === "openended"
                    ? "Open-Ended"
                    : product.quizType === "blanks"
                      ? "Fill-in-Blanks"
                      : "Coding Challenges"}
              </Badge>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">{product.name}</h3>

          <p className="text-lg text-primary/80 italic mb-4 line-clamp-2">{product.tagline}</p>

          <p className="text-muted-foreground mb-6 line-clamp-3">{product.description}</p>

          {/* Fix button display on mobile */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <FeedbackButton
              className="rounded-full px-6 py-2 w-full sm:w-auto"
              onClickAsync={handleNavigation}
              loadingText={product.type === "course" ? "Creating course..." : "Generating quiz..."}
              successText={product.type === "course" ? "Course ready" : "Quiz ready"}
              aria-label={`${product.type === "course" ? "Create Course" : "Generate Quiz"} ${product.name}`}
            >
              {product.type === "course" ? "Create Course" : "Generate Quiz"}
              <motion.span
                className="inline-block ml-2"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </FeedbackButton>
          </div>

          <motion.p
            className="text-xs text-muted-foreground mt-2 text-center opacity-0 hover:opacity-100 transition-opacity"
            whileHover={{ opacity: 1 }}
          >
            {product.type === "course" ? "AI-powered course creation" : "Intelligent quiz generation"}
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className="order-1 md:order-2 flex justify-center items-center"
        initial={{ opacity: 0, scale: 0.9, y: 15 }} // Increased from 0.8, reduced from 20
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: APPLE_EASING }} // Reduced from 0.6
      >
        <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={
              isActive
                ? {
                    scale: [1, 1.03, 1],
                    rotate: [0, 0.5, -0.5, 0],
                  }
                : {}
            }
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: APPLE_EASING,
            }}
          >
            {product.type === "course" ? (
              <BookOpen className="h-20 w-20 text-primary/40" aria-hidden="true" />
            ) : (
              <HelpCircle className="h-20 w-20 text-primary/40" aria-hidden="true" />
            )}
          </motion.div>

          {/* Optimize particles by reducing count and animation complexity */}
          {isActive && (
            <>
              {[...Array(4)].map(
                (
                  _,
                  i, // Reduced from 6
                ) => (
                  <motion.div
                    key={`particle-${product.id}-${i}`}
                    className="absolute w-2 h-2 rounded-full bg-primary/30"
                    initial={{
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      opacity: 0,
                    }}
                    animate={{
                      x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                      y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                      opacity: [0, 0.7, 0],
                      scale: [0.9, 1.1, 0.9], // Reduced from [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 5 + Math.random() * 4, // Reduced from 6 + Math.random() * 6
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "linear",
                      delay: i * 0.7,
                    }}
                  />
                ),
              )}
            </>
          )}

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  )
}

const mockProducts: CourseQuizCard[] = [
  {
    id: "1",
    name: "Video-to-Course Converter",
    slug: "video-to-course",
    description:
      "Upload any video and automatically generate a complete course with chapters, sections, and learning objectives based on the content.",
    tagline: "Transform videos into structured courses",
    type: "course",
  },
  {
    id: "2",
    name: "Transcript Generator",
    slug: "transcript-generator",
    description:
      "Automatically transcribe video content with high accuracy, creating the foundation for your courses and quizzes.",
    tagline: "Accurate video transcription in minutes",
    type: "course",
  },
  {
    id: "3",
    name: "Course Structure Optimizer",
    slug: "course-optimizer",
    description:
      "AI analyzes your content and organizes it into the most effective learning structure with proper pacing and sequencing.",
    tagline: "Optimized learning pathways",
    type: "course",
  },
  {
    id: "4",
    name: "Multiple Choice Quiz Creator",
    slug: "mcq-creator",
    description:
      "Generate adaptive multiple-choice questions that automatically adjust difficulty based on user performance.",
    tagline: "Smart MCQs that adapt to learners",
    type: "quiz",
    quizType: "mcq",
  },
  {
    id: "5",
    name: "Coding Challenge Generator",
    slug: "coding-challenges",
    description:
      "Submit code and receive instant AI feedback with detailed explanations and suggestions for improvement. Perfect for programming courses.",
    tagline: "Interactive coding assessments",
    type: "quiz",
    quizType: "code",
  },
  {
    id: "6",
    name: "Open-Ended Question Generator",
    slug: "open-ended-generator",
    description:
      "Create thought-provoking open-ended questions with AI-powered grading that provides personalized feedback on user responses.",
    tagline: "AI-graded essay questions",
    type: "quiz",
    quizType: "openended",
  },
]

export default ProductGallery
