"use client"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useInView, useSpring } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRight, Menu, X, ArrowUpRight, Check, ArrowUp } from "lucide-react"
import { FeedbackButton } from "@/components/ui/feedback-button"
import AboutSection from "./sections/AboutSection"
import FaqAccordion from "./sections/FaqAccordion"
import FeatureShowcase from "./sections/FeatureShowcase"
import HowItWorksSection from "./sections/HowItWorksSection"
import ProductGallery from "./sections/ShowCase"
import TestimonialsSlider from "./sections/TestimonialsSlider"
import HeroSection from "./sections/HeroSection"

import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
import AnimatedSVGPath from "../animations/AnimatedSVGPath"

// Optimize the APPLE_EASING constant to use the more performant cubic-bezier function
const APPLE_EASING = [0.22, 0.61, 0.36, 1]

// Replace the debounce function with a more optimized version that uses requestAnimationFrame
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let requestId: number | null = null

  return function executedFunction(...args: any[]) {
    const later = () => {
      if (timeout !== null) clearTimeout(timeout)
      if (requestId !== null) cancelAnimationFrame(requestId)
      func(...args)
    }

    if (timeout !== null) clearTimeout(timeout)
    if (requestId !== null) cancelAnimationFrame(requestId)
    timeout = setTimeout(later, wait)
    requestId = requestAnimationFrame(() => {}) // Throttle using rAF
  }
}

const CourseAILandingPage = () => {
  const { theme } = useTheme()
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const router = useRouter()

  // Add this at the top of the component, after the router declaration
  const scrollVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6, // Reduced from 0.8 for better performance
        ease: APPLE_EASING,
      },
    },
  }

  // Refs for sections
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const showCaseRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Navigation items
  const navItems = [
    { id: "hero", label: "Home", ref: heroRef },
    { id: "features", label: "Features", ref: featuresRef },
    { id: "showcase", label: "ShowCase", ref: showCaseRef },
    { id: "about", label: "About Us", ref: aboutRef },
    { id: "how-it-works", label: "How It Works", ref: howItWorksRef },
    { id: "testimonials", label: "Testimonials", ref: testimonialsRef },
    { id: "faq", label: "FAQ", ref: faqRef },
  ]

  // Apple-style scroll animations
  const { scrollY } = useScroll()
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 300,
    damping: 40,
    mass: 0.5,
  })

  // Optimize the headerBg transform to be more performant
  const headerBg = useTransform(smoothScrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"], {
    clamp: true, // Add clamp for better performance
  })
  const headerBgDark = useTransform(smoothScrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"], {
    clamp: true,
  })
  const headerBorder = useTransform(smoothScrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(0, 0, 0, 0.08)"], {
    clamp: true,
  })
  const headerBorderDark = useTransform(smoothScrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(255, 255, 255, 0.08)"], {
    clamp: true,
  })

  // Enhance the logo animation
  const logoScale = useTransform(smoothScrollY, [0, 100], [1, 0.92])
  const logoOpacity = useTransform(smoothScrollY, [0, 100], [1, 0.95])

  // Handle scroll events
  useEffect(() => {
    const sections = [
      { id: "hero", ref: heroRef },
      { id: "features", ref: featuresRef },
      { id: "showcase", ref: showCaseRef },
      { id: "about", ref: aboutRef },
      { id: "how-it-works", ref: howItWorksRef },
      { id: "testimonials", ref: testimonialsRef },
      { id: "faq", ref: faqRef },
      { id: "cta", ref: ctaRef },
    ]

    const handleScroll = debounce(() => {
      const scrollPosition = window.scrollY
      setShowScrollTop(scrollPosition > 500)

      // Use a more efficient way to determine active section
      let currentSection = "hero"
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 3) {
            currentSection = section.id
            break
          }
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection)
      }
    }, 100) // Increased from 50ms to 100ms for better performance

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const startTrial = async () => {
    // Simulate API call or processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/dashboard/subscription")
    return true
  }

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: "smooth",
      })
    }
    setIsMenuOpen(false)
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

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

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header with Apple-style animations */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-300"
        style={{
          backgroundColor: theme === "dark" ? headerBgDark : headerBg,
          borderBottom: `1px solid ${theme === "dark" ? headerBorderDark : headerBorder}`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: APPLE_EASING, delay: 0.2 }}
        role="banner"
      >
        {/* Logo with improved animation and accessibility */}
        <motion.div
          style={{ scale: logoScale, opacity: logoOpacity }}
          className="flex items-center"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link href="/" className="text-xl font-semibold" aria-label="CourseAI Home">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">CourseAI</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation with improved accessibility */}
        <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "text-sm font-medium transition-colors relative px-2 py-1",
                activeSection === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={activeSection === item.id ? "page" : undefined}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3, ease: APPLE_EASING },
              }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* CTA Button with improved visibility and interaction */}
        <div className="hidden md:block">
          <FeedbackButton
            className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            loadingText="Redirecting..."
            successText="Redirecting..."
            onClickAsync={async () => {
              router.push("/dashboard/explore")
              return true
            }}
          >
            Get Started
            <motion.span className="inline-block ml-2">
              <ArrowUpRight className="h-4 w-4" />
            </motion.span>
          </FeedbackButton>
        </div>

        {/* Mobile Menu Button with improved accessibility */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Menu className="h-6 w-6" />
        </motion.button>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: APPLE_EASING }}
              className="fixed inset-0 bg-background/80 backdrop-blur-lg z-40"
              onClick={() => setIsMenuOpen(false)}
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
              className="fixed top-0 right-0 bottom-0 w-80 bg-background/95 backdrop-blur-xl z-50 shadow-xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-end p-4">
                <motion.button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Close menu"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              <nav className="flex flex-col p-4 space-y-4">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "text-left py-3 px-4 rounded-lg transition-colors",
                      activeSection === item.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50",
                    )}
                    aria-current={activeSection === item.id ? "page" : undefined}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.05 * index,
                      ease: APPLE_EASING,
                    }}
                    whileHover={{
                      x: 5,
                      transition: { duration: 0.3, ease: APPLE_EASING },
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
                    duration: 0.4,
                    delay: 0.4,
                    ease: APPLE_EASING,
                  }}
                >
                  <FeedbackButton
                    className="mt-4 w-full rounded-full"
                    loadingText="Loading..."
                    successText="Starting trial"
                    onClickAsync={async () => {
                      scrollToSection("cta")
                      setIsMenuOpen(false)
                      return true
                    }}
                  >
                    Start free trial
                    <motion.span
                      className="inline-block ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </FeedbackButton>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section id="hero" ref={heroRef}>
          <HeroSection
            scrollToFeatures={() => scrollToSection("features")}
            scrollToHowItWorks={() => scrollToSection("how-it-works")}
          />
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-20 md:py-32 relative">
          <FeatureShowcase />
        </section>

        {/* Product Gallery Section */}
        <section id="showcase" ref={showCaseRef} className="py-20 md:py-32 relative bg-muted/10">
          <ProductGallery />
        </section>

        {/* About Us Section */}
        <section id="about" ref={aboutRef} className="py-20 md:py-32 relative">
          <AboutSection />
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" ref={howItWorksRef} className="py-20 md:py-32 relative">
          <HowItWorksSection />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="py-20 md:py-32 relative bg-muted/10">
          <TestimonialsSlider />
        </section>

        {/* FAQ Section */}
        <section id="faq" ref={faqRef} className="py-20 md:py-32 relative">
          <FaqAccordion />
        </section>

        {/* CTA Section */}
        <section id="cta" ref={ctaRef} className="py-20 md:py-32 relative">
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />

              <div className="relative p-8 md:p-16 text-center">
                <RevealAnimation>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                    Ready to create something extraordinary?
                  </h2>
                </RevealAnimation>

                <RevealAnimation delay={0.1}>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    Whether you're passionate about design, technology, or storytelling—CourseAI helps you build
                    engaging content on any topic imaginable. Intuitive, powerful, and designed for everyone.
                  </p>
                </RevealAnimation>

                <RevealAnimation delay={0.2}>
                  <FeedbackButton
                    size="lg"
                    className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg"
                    loadingText="Starting trial..."
                    successText="Trial started!"
                    errorText="Please try again"
                    onClickAsync={startTrial}
                  >
                    Start 1-month free trial
                    <motion.span
                      className="inline-block ml-2"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.span>
                  </FeedbackButton>
                </RevealAnimation>

                <RevealAnimation delay={0.3}>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-8">
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3, ease: APPLE_EASING }}
                    >
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm">No experience required</span>
                    </motion.div>
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3, ease: APPLE_EASING }}
                    >
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm">1-month free trial</span>
                    </motion.div>
                  </div>
                </RevealAnimation>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: APPLE_EASING }}
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-primary hover:bg-primary/90 p-3 text-primary-foreground"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourseAILandingPage

// Optimize the RevealAnimation component for better performance
const RevealAnimation: React.FC<{
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  className?: string
}> = ({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  duration = 0.8, // Reduced from 1.0 for better performance
  className = "",
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    amount: 0.15,
    margin: "-50px 0px",
  })

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance }
      case "down":
        return { opacity: 0, y: -distance }
      case "left":
        return { opacity: 0, x: distance }
      case "right":
        return { opacity: 0, x: -distance }
      default:
        return { opacity: 0, y: distance }
    }
  }

  const variants = {
    hidden: getInitialPosition(),
    visible: direction === "up" || direction === "down" ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: APPLE_EASING,
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}
export { RevealAnimation }
export { AnimatedSVGPath }
