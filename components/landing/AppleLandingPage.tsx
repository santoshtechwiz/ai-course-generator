"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronDown, ArrowRight, Menu, X, Play, ArrowUpRight, Check, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import FaqAccordion from "./sections/FaqAccordion"
import FeatureShowcase from "./sections/FeatureShowcase"
import HowItWorksSection from "./sections/HowItWorksSection"
import ProductGallery from "./sections/ProductGallery"
import TestimonialsSlider from "./sections/TestimonialsSlider"
import VideoPlayer from "./sections/VideoPlayer"



const AppleLandingPage = () => {
  const { theme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Refs for sections
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const productRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Navigation items
  const navItems = [
    { id: "hero", label: "Home", ref: heroRef },
    { id: "features", label: "Features", ref: featuresRef },
    { id: "product", label: "Product", ref: productRef },
    { id: "how-it-works", label: "How It Works", ref: howItWorksRef },
    { id: "testimonials", label: "Testimonials", ref: testimonialsRef },
    { id: "faq", label: "FAQ", ref: faqRef },
  ]

  // Scroll animations
  const { scrollY } = useScroll()
  const headerBg = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"])
  const headerBgDark = useTransform(scrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"])
  const headerBorder = useTransform(scrollY, [0, 100], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"])
  const headerBorderDark = useTransform(scrollY, [0, 100], ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.1)"])
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.9])

  // Parallax effects for hero section
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setShowScrollTop(scrollPosition > 500)

      // Determine active section
      const sections = [
        { id: "hero", ref: heroRef },
        { id: "features", ref: featuresRef },
        { id: "product", ref: productRef },
        { id: "how-it-works", ref: howItWorksRef },
        { id: "testimonials", ref: testimonialsRef },
        { id: "faq", ref: faqRef },
        { id: "cta", ref: ctaRef },
      ]

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 2) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-300"
        style={{
          backgroundColor: theme === "dark" ? headerBgDark : headerBg,
          borderBottom: `1px solid ${theme === "dark" ? headerBorderDark : headerBorder}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <motion.div style={{ scale: logoScale }} className="flex items-center">
          <Link href="/" className="text-xl font-semibold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">CourseAI</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "text-sm font-medium transition-colors relative",
                activeSection === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => scrollToSection("cta")}
            >
              Get Started
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-background/90 backdrop-blur-lg z-50 shadow-xl"
            >
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col p-4 space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "text-left py-3 px-4 rounded-lg transition-colors",
                      activeSection === item.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                <Button
                  className="mt-4 w-full rounded-full"
                  onClick={() => {
                    scrollToSection("cta")
                    setIsMenuOpen(false)
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section
          id="hero"
          ref={heroRef}
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 pointer-events-none" />

          {/* Content */}
          <div className="container max-w-6xl mx-auto px-4 md:px-6 z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Introducing CourseAI
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
            >
              Learn anything with
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 ml-2">
                AI-powered
              </span>
              <br />
              course creation
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Transform your knowledge into engaging courses with AI-generated content, interactive quizzes, and
              personalized learning paths.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
                onClick={() => scrollToSection("features")}
              >
                Get Started
                <motion.span
                  className="inline-block ml-2"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300 flex items-center gap-2"
                onClick={() => scrollToSection("how-it-works")}
              >
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>
          </div>

          {/* Hero Video/Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
            className="w-full max-w-5xl mx-auto mt-16 px-4 relative z-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <VideoPlayer />
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer"
            onClick={() => scrollToSection("features")}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-20 md:py-32 relative">
          <FeatureShowcase />
        </section>

        {/* Product Gallery Section */}
        <section id="product" ref={productRef} className="py-20 md:py-32 relative bg-muted/10">
          <ProductGallery />
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
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />

              {/* Content */}
              <div className="relative p-8 md:p-16 text-center">
                <RevealAnimation>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your learning?</h2>
                </RevealAnimation>

                <RevealAnimation delay={0.1}>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    Join thousands of educators and learners who are already using CourseAI to create engaging,
                    personalized learning experiences.
                  </p>
                </RevealAnimation>

                <RevealAnimation delay={0.2}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      size="lg"
                      className="px-8 py-6 text-lg rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl group"
                    >
                      Start for free
                      <motion.span
                        className="inline-block ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="px-8 py-6 text-lg rounded-full border-primary/20 hover:bg-primary/10 transition-all duration-300"
                    >
                      Contact sales
                    </Button>
                  </div>
                </RevealAnimation>

                <RevealAnimation delay={0.3}>
                  <div className="mt-10 flex items-center justify-center space-x-8">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm">No credit card required</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm">14-day free trial</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span className="text-sm">Cancel anytime</span>
                    </div>
                  </div>
                </RevealAnimation>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
   
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              variant="default"
              size="icon"
              className="rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              onClick={scrollToTop}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AppleLandingPage

// Reusable animation component
const RevealAnimation = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
