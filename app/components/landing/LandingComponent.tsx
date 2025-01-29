"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useAnimation, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useInView } from "framer-motion"
import type React from "react" // Added import for React

import FeatureSections from "@/app/components/landing/FeatureSection"
import HowItWorks from "@/app/components/landing/HowItWorks"
import LandingCTA from "@/app/components/landing/LandingCTA"
import LandingHero from "./LandingHero"
import FAQSection from "./FaqSection"
import LandingHeader from "./LanndingHeader"


// Dynamically import heavy components
const ShowcaseSection = dynamic(() => import("./ShowcaseSection"), { ssr: false })
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), { ssr: false })
const AboutUs = dynamic(() => import("@/app/about/AboutUs"), { ssr: false })

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const stagger: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Type definitions
type SectionKey = "how-it-works" | "features" | "showcase" | "testimonials" | "faq" | "cta" | "about"

type SectionRefs = {
  [key in SectionKey]: React.RefObject<HTMLElement>
}

type SectionConfig = {
  key: SectionKey
  title: string
  description: string
  Component: React.ComponentType<any>
  props?: Record<string, any>
}

type LandingComponentProps = {
  sections?: SectionConfig[]
}

export default function LandingComponent({ sections }: LandingComponentProps) {
  const router = useRouter()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const controls = useAnimation()

  // Default sections configuration
  const defaultSections: SectionConfig[] = [
    {
      key: "how-it-works",
      title: "How It Works",
      description: "See how our AI transforms your ideas into a complete course",
      Component: HowItWorks,
    },
    {
      key: "features",
      title: "Features",
      description: "Discover the powerful features that make course creation effortless",
      Component: FeatureSections,
      props: { controls },
    },
    {
      key: "showcase",
      title: "Showcase",
      description: "Explore some of the amazing courses created with our platform",
      Component: ShowcaseSection,
    },
    {
      key: "testimonials",
      title: "Testimonials",
      description: "Hear what our users have to say about their experience",
      Component: TestimonialsSection,
    },
    {
      key: "faq",
      title: "Frequently Asked Questions",
      description: "Find answers to commonly asked questions",
      Component: FAQSection,
    },
    {
      key: "about",
      title: "About Us",
      description: "Discover the story behind CourseAI",
      Component: AboutUs,
    },
  ]

  const sectionConfigs = sections || defaultSections

  // Refs for sections
  const sectionInViewRefs: SectionRefs = sectionConfigs.reduce((acc, section) => {
    acc[section.key] = useRef(null)
    return acc
  }, {} as SectionRefs)

  // Check if sections are in view
  const sectionInView = sectionConfigs.reduce(
    (acc, section) => {
      acc[section.key] = useInView(sectionInViewRefs[section.key], { once: true, amount: 0.3 })
      return acc
    },
    {} as Record<SectionKey, boolean>,
  )

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle topic submission
  const handleTopicSubmit = (topic: string) => {
    if (topic) {
      router.push(`/dashboard/create?topic=${encodeURIComponent(topic)}`)
    } else {
      router.push("/dashboard/create")
    }
  }

  // Handle sign-in click
  const handleSignInClick = () => {
    router.push("/auth/signin?callbackUrl=/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingHeader />
      <main className="space-y-24 pb-24">
        <LandingHero onTopicSubmit={handleTopicSubmit} />

        {sectionConfigs.map((section, index) => (
          <Element key={section.key} name={section.key}>
            <section
              ref={sectionInViewRefs[section.key]}
              className={`py-20 px-4 ${index % 2 === 1 ? "bg-muted/20" : ""}`}
            >
              <motion.div
                className="container mx-auto max-w-6xl"
                initial="hidden"
                animate={sectionInView[section.key] ? "visible" : "hidden"}
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
              >
                <motion.div variants={stagger} className="space-y-12">
                  <motion.div variants={fadeInUp}>
                    <motion.div variants={fadeInUp} className="text-center space-y-4 mb-12">
                      <h2 className="text-3xl font-bold text-primary text-gradient capitalize">{section.title}</h2>
                      <p className="text-muted-foreground max-w-2xl mx-auto">{section.description}</p>
                    </motion.div>
                    <section.Component
                      {...(section.props || {})}
                      sectionRef={sectionInViewRefs[section.key]}
                      handleSignInClick={handleSignInClick}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </section>
          </Element>
        ))}

        <section className="py-20 px-4">
          <LandingCTA handleSignInClick={handleSignInClick} />
        </section>
      </main>

      {/* Scroll to top button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          variant="default"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  )
}

