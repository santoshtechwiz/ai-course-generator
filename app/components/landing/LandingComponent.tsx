"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useAnimation, type Variants } from "framer-motion"
import { Element } from "react-scroll"
import { ArrowUp } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { FAQSection } from "@/app/components/landing/FaqSection"
import FeatureSections from "@/app/components/landing/FeatureSection"
import HowItWorks from "@/app/components/landing/HowItWorks"
import LandingCTA from "@/app/components/landing/LandingCTA"
import LandingHero from "./LandingHero"

import { useInView } from "framer-motion"
import LandingHeader from "./LanndingHeader"

// Dynamically import heavy components
const ShowcaseSection = dynamic(() => import("./ShowcaseSection"), { ssr: false })
const TestimonialsSection = dynamic(() => import("./TestimonialsSection"), { ssr: false })

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

export default function LandingComponent() {
  const router = useRouter()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const sectionInViewRefs = {
    "how-it-works": useRef(null),
    features: useRef(null),
    showcase: useRef(null),
    testimonials: useRef(null),
    faq: useRef(null),
    cta: useRef(null),
  }

  const howItWorksInView = useInView(sectionInViewRefs["how-it-works"], { once: true, amount: 0.3 })
  const featuresInView = useInView(sectionInViewRefs["features"], { once: true, amount: 0.3 })
  const showcaseInView = useInView(sectionInViewRefs["showcase"], { once: true, amount: 0.3 })
  const testimonialsInView = useInView(sectionInViewRefs["testimonials"], { once: true, amount: 0.3 })
  const faqInView = useInView(sectionInViewRefs["faq"], { once: true, amount: 0.3 })
  const landingCTAInView = useInView(sectionInViewRefs["cta"], { once: true, amount: 0.3 })
  const controls = useAnimation()

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleTopicSubmit = (topic: string) => {
    if (topic) {
      router.push(`/dashboard/create?topic=${encodeURIComponent(topic)}`)
    } else {
      router.push("/dashboard/create")
    }
  }

  const handleSignInClick = () => {
    router.push("/auth/signin?callbackUrl=/dashboard")
  }

  const getSectionInView = (section: string) => {
    switch (section) {
      case "how-it-works":
        return howItWorksInView
      case "features":
        return featuresInView
      case "showcase":
        return showcaseInView
      case "testimonials":
        return testimonialsInView
      case "faq":
        return faqInView
      case "cta":
        return landingCTAInView
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <LandingHeader />
      <main className="space-y-24 pb-24">
        <LandingHero onTopicSubmit={handleTopicSubmit} />

        {["how-it-works", "features", "showcase", "testimonials", "faq"].map((section, index) => (
          <Element key={section} name={section}>
            <section
              ref={(el) => (sectionInViewRefs[section].current = el)}
              className={`py-20 px-4 ${index % 2 === 1 ? "bg-muted/20" : ""}`}
            >
              <motion.div
                className="container mx-auto max-w-6xl"
                initial="hidden"
                animate={getSectionInView(section) ? "visible" : "hidden"}
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
              >
                <motion.div variants={stagger} className="space-y-12">
                  <motion.div variants={fadeInUp}>
                    {getSectionComponent(section, { controls, handleSignInClick })}
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

function getDescriptionForSection(section: string): string {
  switch (section) {
    case "how-it-works":
      return "See how our AI transforms your ideas into a complete course"
    case "features":
      return "Discover the powerful features that make course creation effortless"
    case "showcase":
      return "Explore some of the amazing courses created with our platform"
    case "testimonials":
      return "Hear what our users have to say about their experience"
    case "faq":
      return "Find answers to commonly asked questions"
    case "cta":
      return "Ready to get started? Sign up now"
    default:
      return ""
  }
}

function getSectionComponent(section: string, props: any) {
  const title = section.replace("-", " ")
  const description = getDescriptionForSection(section)

  return (
    <>
      <motion.div variants={fadeInUp} className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold text-primary capitalize">{title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
      </motion.div>
      {renderSectionContent(section, props)}
    </>
  )
}

function renderSectionContent(section: string, props: any) {
  switch (section) {
    case "how-it-works":
      return <HowItWorks />
    case "features":
      return <FeatureSections featuresRef={props.featuresRef} controls={props.controls} />
    case "showcase":
      return <ShowcaseSection />
    case "testimonials":
      return <TestimonialsSection />
    case "faq":
      return <FAQSection />
    case "cta":
      return <LandingCTA handleSignInClick={props.handleSignInClick} />
    default:
      return null
  }
}

