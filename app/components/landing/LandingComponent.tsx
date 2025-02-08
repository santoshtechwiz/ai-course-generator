"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

import FeatureSections from "@/app/components/landing/FeatureSection"
import HowItWorks from "@/app/components/landing/HowItWorks"

import LandingHero from "./LandingHero"
import FAQSection from "./FaqSection"
import LandingHeader from "./LanndingHeader"


// Dynamically import heavy components
const ShowcaseSection = dynamic(() => import("./ShowcaseSection"), { ssr: false })
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), { ssr: false })
const AboutUs = dynamic(() => import("@/app/about/AboutUs"), { ssr: false })

// Animation variants
const fadeInUp: Variants = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

const fadeInLeft: Variants = {
  hidden: { x: -60, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

const fadeInRight: Variants = {
  hidden: { x: 60, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

// Type definitions
type SectionConfig = {
  key: string
  title: string
  description: string
  Component: React.ComponentType<any>
  props?: any
}

type LandingComponentProps = {
  sections?: SectionConfig[]
}

const defaultSections: SectionConfig[] = [
 
  {
    key: "features",
    title: "Features",
    description: "",
    Component: FeatureSections,
  },
  {
    key: "how-it-works",
    title: "How it Works",
    description: "Learn how it all works.",
    Component: HowItWorks,
  },
  {
    key: "showcase",
    title: "Explore Our Platform",
    description: "Discover a world of interactive courses and engaging quizzes designed to enhance your learning experience.",
    Component: ShowcaseSection,
  },
  {
    key: "testimonials",
    title: "Testimonials",
    description: "Hear what our customers say.",
    Component: TestimonialsSection,
  },
  {
    key: "about",
    title: "About Us",
    description: "Learn more about us.",
    Component: AboutUs,
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Frequently Asked Questions",
    Component: FAQSection,
  },
]

export default function LandingComponent({ sections = defaultSections }: LandingComponentProps) {
  const router = useRouter()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY
    setShowScrollTop(scrollY > 300)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const handleTopicSubmit = useCallback((topic: string) => {
    console.log("Topic submitted:", topic)
  }, [])

  const handleSignInClick = useCallback(() => {
    router.push("/sign-in")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingHeader />
      <main className="space-y-16 pb-16">
        <LandingHero onTopicSubmit={handleTopicSubmit} />

        {sections.map((section, index) => (
          <Element key={section.key} name={section.key}>
            <section
              ref={(el) => (sectionRefs.current[section.key] = el)}
              className={`py-12 px-4 ${index % 2 === 1 ? "bg-muted/20" : ""}`}
            >
              <motion.div
                className="container mx-auto max-w-6xl"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
              >
                <motion.div variants={stagger} className="space-y-8">
                  <motion.div variants={fadeInUp}>
                    <motion.div variants={fadeInUp} className="text-center space-y-2 mb-8">
                      <h2 className="text-2xl font-bold text-primary text-gradient capitalize">{section.title}</h2>
                      <p className="text-muted-foreground max-w-2xl mx-auto text-sm">{section.description}</p>
                    </motion.div>
                    <section.Component {...(section.props || {})} handleSignInClick={handleSignInClick} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </section>
          </Element>
        ))}

       
      </main>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          variant="default"
          size="sm"
          className="rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}

