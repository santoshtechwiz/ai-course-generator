"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useInView, useAnimation } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Filter,
  Loader2,
  AlertCircle,
  Pause,
  Play,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

// Types based on the API response
interface CourseQuizCard {
  id: string
  name: string
  slug: string
  description: string
  tagline: string
  type: "course" | "quiz"
  quizType?: "mcq" | "openended" | "fill-blanks" | "code"
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

const useAutoplay = (itemCount: number, initialDelay = 5000) => {
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [delay, setDelay] = useState(initialDelay)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayEnabled((prev) => !prev)
  }, [])

  const goToNext = useCallback(() => {
    if (itemCount <= 1) return
    setCurrentIndex((prev) => (prev + 1) % itemCount)
  }, [itemCount])

  const goToPrev = useCallback(() => {
    if (itemCount <= 1) return
    setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount)
  }, [itemCount])

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setCurrentIndex(index)
      }
    },
    [itemCount],
  )

  useEffect(() => {
    setCurrentIndex(0)
  }, [itemCount])

  useEffect(() => {
    if (!isAutoplayEnabled || itemCount <= 1) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setTimeout(() => {
      goToNext()
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isAutoplayEnabled, currentIndex, itemCount, delay, goToNext])

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
          AI-Powered Learning
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Smart Learning with CourseAI
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Discover AI-curated courses and adaptive quizzes tailored to your learning style and pace
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
                AI Courses
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-full">
                AI Quizzes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={retryFetch} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState onReset={() => setFilter("all")} />
      ) : (
        <div className="relative">
          <NavigationButtons onPrev={prevProduct} onNext={nextProduct} disabled={filteredProducts.length <= 1} />

          <motion.div
            className="absolute top-0 right-0 z-10 m-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAutoplay}
              className="rounded-full bg-background/80 backdrop-blur-sm"
              aria-label={isAutoplayEnabled ? "Pause autoplay" : "Start autoplay"}
            >
              {isAutoplayEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
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
                    key={`${product.id}-${index}-${product.slug}`}
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
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === activeIndex ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LoadingState = () => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading AI courses...</p>
    </motion.div>
  </div>
)

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md p-6">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button variant="default" onClick={onRetry} className="rounded-full">
        Try Again
      </Button>
    </motion.div>
  </div>
)

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md p-6">
      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">No AI content found matching your filter.</p>
      <Button variant="outline" onClick={onReset} className="rounded-full">
        Show All Content
      </Button>
    </motion.div>
  </div>
)

const NavigationButtons = ({
  onPrev,
  onNext,
  disabled,
}: {
  onPrev: () => void
  onNext: () => void
  disabled: boolean
}) => (
  <>
    <div className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 z-10">
      <motion.div
        whileHover={{ scale: 1.1, x: -3 }}
        whileTap={{ scale: 0.95 }}
        className={disabled ? "opacity-50" : ""}
      >
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={onPrev}
          disabled={disabled}
          aria-label="Previous product"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>

    <div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 z-10">
      <motion.div whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.95 }} className={disabled ? "opacity-50" : ""}>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
          onClick={onNext}
          disabled={disabled}
          aria-label="Next product"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
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

const APPLE_EASING = [0.17, 0.67, 0.83, 0.67]

const ProductCard = ({ product, isActive, theme }: CourseQuizCardProps) => {
  const router = useRouter()

  const handleNavigation = () => {
    if (product.type === "course") {
      router.push(`/dashboard/course/${product.slug}`)
    } else if (product.type === "quiz" && product.quizType) {
      router.push(`/dashboard/${product.quizType=="fill-blanks"?"blanks":product.quizType}/${product.slug}`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 md:p-8 h-full">
      <div className="order-2 md:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: APPLE_EASING }}
        >
          <div className="flex items-center mb-4">
            <Badge variant={product.type === "course" ? "default" : "secondary"} className="rounded-full mr-2">
              {product.type === "course" ? "AI Course" : "AI Quiz"}
            </Badge>

            {product.quizType && (
              <Badge variant="outline" className="rounded-full">
                {product.quizType === "mcq"
                  ? "Adaptive MCQ"
                  : product.quizType === "openended"
                    ? "AI Graded"
                    : product.quizType === "fill-blanks"
                      ? "Smart Fill-in"
                      : "AI Code Review"}
              </Badge>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">{product.name}</h3>

          <p className="text-lg text-primary/80 italic mb-4 line-clamp-2">{product.tagline}</p>

          <p className="text-muted-foreground mb-6 line-clamp-3">{product.description}</p>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98, y: 0 }}
            transition={{ duration: 0.3, ease: APPLE_EASING }}
          >
            <Button
              className="rounded-full px-6 py-2"
              onClick={handleNavigation}
              aria-label={`${product.type === "course" ? "Start AI Learning" : "Try AI Quiz"} ${product.name}`}
            >
              {product.type === "course" ? "Start AI Learning" : "Try AI Quiz"}
              <motion.span
                className="inline-block ml-2"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground mt-2 text-center opacity-0 hover:opacity-100 transition-opacity"
            whileHover={{ opacity: 1 }}
          >
            {product.type === "course" ? "AI-powered adaptive course" : "Smart quiz with AI feedback"}
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className="order-1 md:order-2 flex justify-center items-center"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: APPLE_EASING }}
      >
        <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={
              isActive
                ? {
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }
                : {}
            }
            transition={{
              duration: 6,
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

          {isActive && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`particle-${product.id}-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-primary/30"
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: 0,
                  }}
                  animate={{
                    x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                    y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                    opacity: [0, 0.8, 0],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 6 + Math.random() * 6,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "linear",
                    delay: i * 0.7,
                  }}
                />
              ))}
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
    name: "AI-Powered JavaScript",
    slug: "ai-javascript",
    description:
      "Learn JavaScript with AI-generated exercises that adapt to your skill level and learning patterns.",
    tagline: "Master JS with personalized AI guidance",
    type: "course",
  },
  {
    id: "2",
    name: "React with AI Assistant",
    slug: "react-ai-assistant",
    description:
      "Build React apps with real-time AI code suggestions and intelligent debugging assistance.",
    tagline: "Code smarter with AI pair programming",
    type: "course",
  },
  {
    id: "3",
    name: "AI-Driven CSS Mastery",
    slug: "ai-css-mastery",
    description: "Learn CSS with AI that generates visual examples based on your progress and weaknesses.",
    tagline: "Visual learning powered by AI",
    type: "course",
  },
  {
    id: "4",
    name: "AI JavaScript Challenge",
    slug: "ai-js-challenge",
    description:
      "Adaptive quiz that gets harder as you improve, with AI-generated questions tailored to your level.",
    tagline: "Test your skills against our AI",
    type: "quiz",
    quizType: "mcq",
  },
  {
    id: "5",
    name: "AI Code Review",
    slug: "ai-code-review",
    description:
      "Submit your React code and get instant AI feedback with suggestions for improvement.",
    tagline: "Get AI-powered code reviews",
    type: "quiz",
    quizType: "code",
  },
  {
    id: "6",
    name: "AI CSS Puzzle",
    slug: "ai-css-puzzle",
    description:
      "AI-generated CSS challenges that adapt to fill gaps in your knowledge as you progress.",
    tagline: "Solve AI-curated CSS puzzles",
    type: "quiz",
    quizType: "fill-blanks",
  },
]

export default ProductGallery