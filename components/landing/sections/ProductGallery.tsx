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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

// Types based on the API response
interface Product {
  id: string
  name: string
  slug: string
  description: string
  tagline: string
  type: "course" | "quiz"
  quizType?: "mcq" | "openended" | "fill-blanks" | "code"
}

// Custom hook for fetching products
const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // In a real implementation, this would be your API endpoint
        const response = await fetch("/api/carousel-items")

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }

        const data = await response.json()
        setProducts(data)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products. Please try again.")
        setIsLoading(false)

        // For demo purposes, load mock data if API fails after 2 retries
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

// Custom hook for autoplay functionality
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

  // Reset autoplay when item count changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [itemCount])

  // Handle autoplay timer
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
  const { products, isLoading, error, retryFetch } = useProducts()
  const [filter, setFilter] = useState<"all" | "course" | "quiz">("all")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const { theme } = useTheme()

  const containerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3, margin: "100px" })
  const controls = useAnimation()

  // Initialize autoplay
  const {
    currentIndex: activeIndex,
    isAutoplayEnabled,
    toggleAutoplay,
    goToNext: nextProduct,
    goToPrev: prevProduct,
    goToIndex: setActiveIndex,
  } = useAutoplay(filteredProducts.length)

  // Filter products based on selected filter
  useEffect(() => {
    if (filter === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((product) => product.type === filter))
    }
  }, [filter, products])

  // Start animations when section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else {
      controls.start("hidden")
    }
  }, [isInView, controls])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextProduct()
      } else if (e.key === "ArrowLeft") {
        prevProduct()
      } else if (e.key === " ") {
        // Space bar toggles autoplay
        toggleAutoplay()
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextProduct, prevProduct, toggleAutoplay])

  // Pause autoplay when user interacts with the component
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
          Product Showcase
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Powerful tools for every educator
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Explore our suite of AI-powered tools designed to transform how you create and deliver educational content
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
                Courses
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-full">
                Quizzes
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
          {/* Navigation buttons */}
          <NavigationButtons onPrev={prevProduct} onNext={nextProduct} disabled={filteredProducts.length <= 1} />

          {/* Autoplay toggle button */}
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

          {/* Product carousel */}
          <div
            className="overflow-hidden rounded-2xl bg-card/30 backdrop-blur-sm border border-border/10 shadow-lg"
            style={{ perspective: "1500px" }}
            ref={carouselRef}
          >
            <div className="relative" style={{ height: "500px" }}>
              <AnimatePresence mode="wait">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, rotateY: index > activeIndex ? 45 : -45, scale: 0.8 }}
                    animate={{
                      opacity: index === activeIndex ? 1 : 0,
                      rotateY: 0,
                      scale: 1,
                      zIndex: index === activeIndex ? 1 : 0,
                    }}
                    exit={{
                      opacity: 0,
                      rotateY: index < activeIndex ? -45 : 45,
                      scale: 0.8,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      opacity: { duration: 0.5 },
                    }}
                    className={cn(
                      "absolute inset-0 w-full h-full",
                      index === activeIndex ? "pointer-events-auto" : "pointer-events-none",
                    )}
                    style={{
                      display: Math.abs(index - activeIndex) <= 1 ? "block" : "none", // Only render nearby slides
                    }}
                  >
                    <ProductCard product={product} isActive={index === activeIndex} theme={theme} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            totalItems={filteredProducts.length}
            currentIndex={activeIndex}
            isAutoplayEnabled={isAutoplayEnabled}
          />

          {/* Dots indicator */}
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

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading products...</p>
    </motion.div>
  </div>
)

// Error state component
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

// Empty state component
const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <div className="flex items-center justify-center h-80 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/10">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md p-6">
      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">No products found matching your filter.</p>
      <Button variant="outline" onClick={onReset} className="rounded-full">
        Show All Products
      </Button>
    </motion.div>
  </div>
)

// Navigation buttons component
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

// Progress bar component
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
    <div className="mt-6 relative h-1 bg-muted rounded-full overflow-hidden">
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

// Product card component
interface ProductCardProps {
  product: Product
  isActive: boolean
  theme?: string | undefined
}

const ProductCard = ({ product, isActive, theme }: ProductCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 md:p-8 h-full">
      <div className="order-2 md:order-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center mb-4">
            <Badge variant={product.type === "course" ? "default" : "secondary"} className="rounded-full mr-2">
              {product.type === "course" ? "Course" : "Quiz"}
            </Badge>

            {product.quizType && (
              <Badge variant="outline" className="rounded-full">
                {product.quizType === "mcq"
                  ? "Multiple Choice"
                  : product.quizType === "openended"
                    ? "Open Ended"
                    : product.quizType === "fill-blanks"
                      ? "Fill in the Blanks"
                      : "Coding Challenge"}
              </Badge>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">{product.name}</h3>

          <p className="text-lg text-primary/80 italic mb-4 line-clamp-2">{product.tagline}</p>

          <p className="text-muted-foreground mb-6 line-clamp-3">{product.description}</p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="rounded-full">{product.type === "course" ? "Start Learning" : "Take Quiz"}</Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="order-1 md:order-2 flex justify-center items-center"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
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
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            {product.type === "course" ? (
              <BookOpen className="h-20 w-20 text-primary/40" />
            ) : (
              <HelpCircle className="h-20 w-20 text-primary/40" />
            )}
          </motion.div>

          {/* Floating particles for visual interest */}
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
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "linear",
                    delay: i * 0.5,
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

// Mock data for fallback/demo purposes
const mockProducts: Product[] = [
  {
    id: "1",
    name: "JavaScript Fundamentals",
    slug: "javascript-fundamentals",
    description:
      "Learn the core concepts of JavaScript programming with practical exercises and real-world applications.",
    tagline: "Master modern JavaScript from the ground up",
    type: "course",
  },
  {
    id: "2",
    name: "React Component Architecture",
    slug: "react-component-architecture",
    description:
      "Discover best practices for structuring React applications with reusable components and efficient state management.",
    tagline: "Build scalable React applications like a pro",
    type: "course",
  },
  {
    id: "3",
    name: "CSS Grid & Flexbox Mastery",
    slug: "css-grid-flexbox",
    description: "Comprehensive guide to modern CSS layout techniques with Grid and Flexbox for responsive web design.",
    tagline: "Create beautiful layouts with confidence",
    type: "course",
  },
  {
    id: "4",
    name: "JavaScript Array Methods",
    slug: "javascript-array-methods",
    description:
      "Test your knowledge of JavaScript array methods with this comprehensive quiz covering map, filter, reduce and more.",
    tagline: "Challenge your array manipulation skills",
    type: "quiz",
    quizType: "mcq",
  },
  {
    id: "5",
    name: "React Hooks Challenge",
    slug: "react-hooks-challenge",
    description:
      "Put your React Hooks knowledge to the test with practical coding challenges and real-world scenarios.",
    tagline: "Prove your React Hooks expertise",
    type: "quiz",
    quizType: "code",
  },
  {
    id: "6",
    name: "CSS Selectors Mastery",
    slug: "css-selectors",
    description:
      "Fill in the blanks to complete CSS selector challenges ranging from basic to advanced targeting techniques.",
    tagline: "Perfect your CSS targeting skills",
    type: "quiz",
    quizType: "fill-blanks",
  },
]

export default ProductGallery
