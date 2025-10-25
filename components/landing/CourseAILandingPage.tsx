"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowUp } from "lucide-react"
import { FeedbackButton } from "@/components/ui/feedback-button"

// Import redesigned sections
import HeroSection from "./sections/HeroSection"
import FeatureShowcase from "./sections/FeatureShowcase"
import HowItWorksSection from "./sections/HowItWorksSection"
import TestimonialsSlider from "./sections/TestimonialsSlider"
import AboutSection from "./sections/AboutSection"
import FaqAccordion from "./sections/FaqAccordion"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks"
import { useTheme } from "next-themes"
import Link from "next/link"

// Apple-style easing
const APPLE_EASING = [0.25, 0.1, 0.25, 1]

// Simplified navigation
const navItems = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "testimonials", label: "Testimonials" },
  { id: "about", label: "About" },
  { id: "faq", label: "FAQ" },
]

const CourseAILandingPage = () => {
  const { theme } = useTheme()
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const router = useRouter()

  // Client-side hydration
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Smooth scroll to section
  const scrollToSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId)
      if (element) {
        const offsetTop = element.offsetTop - 80 // Account for fixed header
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        })
      }
      setIsMenuOpen(false)
    },
    [setIsMenuOpen],
  )

  // Toggle mobile menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: APPLE_EASING }}
          className="text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-sm bg-primary border-4 border-border flex items-center justify-center shadow-[4px_4px_0px_0px_var(--border)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full"
            />
          </div>
          <p className="text-foreground font-medium">Loading CourseAI...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-sm text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/50 border-3 border-border"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-4 border-primary">
        <div className="flex items-center justify-between h-16 px-2 sm:px-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-black" aria-label="CourseAI Home">
              <span className="text-primary">CourseAI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2" aria-label="Main navigation" role="navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-bold px-3 py-2 border-2 border-transparent hover:border-primary hover:bg-primary/10 transition-all duration-200 rounded-sm"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <FeedbackButton
              className="px-6 py-2 text-sm font-bold border-3 border-primary bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_var(--primary)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--primary)] transition-all duration-200 rounded-sm"
              loadingText="Redirecting..."
              successText="Redirecting..."
              onClickAsync={async () => {
                router.push("/dashboard/explore")
                return true
              }}
              aria-label="Get started with CourseAI"
            >
              Get Started
            </FeedbackButton>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMenu}
            className="md:hidden text-foreground p-2 rounded-sm hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-primary/50 border-2 border-transparent hover:border-primary"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </motion.button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: APPLE_EASING }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={toggleMenu}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 270,
                damping: 35,
                ease: APPLE_EASING,
              }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-background shadow-[-8px_0px_0px_0px_var(--primary)] z-50 border-l-4 border-primary md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex justify-end p-4">
                <motion.button
                  onClick={toggleMenu}
                  className="p-2 rounded-sm hover:bg-primary/10 transition-all duration-200 border-2 border-transparent hover:border-primary"
                  aria-label="Close menu"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <nav className="flex flex-col p-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left py-3 px-4 rounded-sm transition-all duration-200 text-foreground hover:bg-primary/10 hover:border-primary border-2 border-transparent font-medium"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05 * index,
                      ease: APPLE_EASING,
                    }}
                    whileHover={{
                      x: 5,
                      transition: { duration: 0.2, ease: APPLE_EASING },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </motion.button>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.4,
                    ease: APPLE_EASING,
                  }}
                >
                  <FeedbackButton
                    className="mt-4 w-full bg-primary text-primary-foreground border-3 border-primary"
                    loadingText="Redirecting..."
                    successText="Redirecting..."
                    onClickAsync={async () => {
                      router.push("/dashboard/explore")
                      return true
                    }}
                  >
                    Get Started
                  </FeedbackButton>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main id="main-content">
        {/* Hero Section */}
        <section id="hero" aria-labelledby="hero-heading">
          <HeroSection
            scrollToFeatures={() => scrollToSection("features")}
            scrollToHowItWorks={() => scrollToSection("how-it-works")}
            isHydrated={isLoaded}
          />
        </section>

        <motion.section
          id="features"
          className="py-16 md:py-24 border-t-4 border-primary bg-secondary/20"
          aria-labelledby="features-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <FeatureShowcase />
        </motion.section>

        <motion.section
          id="how-it-works"
          className="py-16 md:py-24 bg-background border-t-4 border-secondary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.1 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <HowItWorksSection />
        </motion.section>

        <motion.section
          id="testimonials"
          className="py-16 md:py-24 border-t-4 border-primary bg-primary/5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.2 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <TestimonialsSlider />
        </motion.section>

        <motion.section
          id="about"
          className="py-16 md:py-24 bg-background border-t-4 border-accent"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.3 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <AboutSection />
        </motion.section>

        <motion.section
          id="faq"
          className="py-16 md:py-24 border-t-4 border-secondary bg-secondary/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.4 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <FaqAccordion />
        </motion.section>

        <motion.section
          id="cta"
          className="py-16 md:py-24 bg-main text-main-foreground border-t-4 border-main"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: APPLE_EASING, delay: 0.5 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: APPLE_EASING }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Start building courses with AI</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: APPLE_EASING }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <p className="text-xl opacity-95 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Create courses, generate quizzes, and track your learning progress. Sign in to get started.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: APPLE_EASING }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <FeedbackButton
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-4 text-lg rounded-sm border-4 border-secondary shadow-[6px_6px_0px_0px_var(--secondary)] hover:translate-x-[2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_var(--secondary)] transition-all duration-200 font-black"
                loadingText="Opening dashboard..."
                successText="Redirecting..."
                errorText="Please try again"
                onClickAsync={async () => {
                  await new Promise((resolve) => setTimeout(resolve, 500))
                  router.push("/dashboard/explore")
                  return true
                }}
              >
                Get Started
              </FeedbackButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: APPLE_EASING }}
              viewport={{ once: true, amount: 0.2 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-95"
            >
              <div className="flex items-center gap-3 px-4 py-2 border-2 border-main-foreground rounded-sm">
                <div className="w-3 h-3 rounded-sm bg-current"></div>
                <span className="text-sm font-bold">AI-powered tools</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 border-2 border-main-foreground rounded-sm">
                <div className="w-3 h-3 rounded-sm bg-current"></div>
                <span className="text-sm font-bold">Multiple quiz types</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 border-2 border-main-foreground rounded-sm">
                <div className="w-3 h-3 rounded-sm bg-current"></div>
                <span className="text-sm font-bold">Progress tracking</span>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: APPLE_EASING }}
            className="fixed bottom-6 right-6 z-50 rounded-sm border-3 border-primary shadow-[4px_4px_0px_0px_var(--primary)] bg-primary text-primary-foreground hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--primary)] p-3 focus:outline-none focus:ring-3 focus:ring-primary/50 transition-all duration-200"
            aria-label="Scroll to top of page"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourseAILandingPage
