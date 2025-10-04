"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"

// Fallback simple animated wrappers
const MaskReveal: React.FC<{ direction?: "left" | "right"; delay?: number; children: React.ReactNode }> = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    {children}
  </motion.div>
)
const ProgressiveText: React.FC<{ text: string; tag?: "h1" | "h2" | "h3" | "p" | "span"; className?: string; delay?: number }> = ({ text, tag = "h2", className, delay = 0 }) => (
  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.4 }}>
    {tag === "h1" ? <h1 className={className}>{text}</h1> : null}
    {tag === "h2" ? <h2 className={className}>{text}</h2> : null}
    {tag === "h3" ? <h3 className={className}>{text}</h3> : null}
    {tag === "p" ? <p className={className}>{text}</p> : null}
    {tag === "span" ? <span className={className}>{text}</span> : null}
  </motion.span>
)
const CountUp: React.FC<{ end: number; separator?: string; prefix?: string }> = ({ end, separator = ",", prefix = "" }) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setValue(Math.floor(end * t))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end])
  return <>{prefix}{value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)}</>
}
import CTASVG from "../svg/CTASVG"
import { FeedbackButton } from "@/components/ui/feedback-button"

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isInView) return null

  return (
    <div className="container max-w-6xl mx-auto px-4 md:px-6" ref={containerRef}>
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="relative p-8 md:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <MaskReveal direction="left">
                <ProgressiveText
                  text="Turn any topic into an interactive course — instantly."
                  tag="h2"
                  className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
                  delay={0.2}
                />
              </MaskReveal>

              <MaskReveal direction="left" delay={0.3}>
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
                  CourseAI helps you create structured courses from any topic in seconds. Generate quizzes automatically
                  or build your own using MCQs, coding questions, fill-in-the-blanks, and open-ended types. Track
                  progress, and even create private courses for your audience.
                </p>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.4}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      <CountUp end={100000} separator="," prefix="+" />
                    </div>
                    <p className="text-muted-foreground">Courses generated</p>
                  </div>
                  <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                      <CountUp end={75000} separator="," prefix="+" />
                    </div>
                    <p className="text-muted-foreground">Quizzes created</p>
                  </div>
                </div>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.5}>
                <FeedbackButton
                  size="lg"
                  className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg"
                  loadingText="Redirecting..."
                  successText="Redirected!"
                  errorText="Please try again"
                  onClickAsync={async () => {
                    
                    await new Promise((resolve) => setTimeout(resolve, 800))
                    router.push("/dashboard/create")
                    return true
                  }}
                >
                  Start creating now
                  <motion.span
                    className="inline-block ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }} // Reduced from 500
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </FeedbackButton>
              </MaskReveal>

              <MaskReveal direction="left" delay={0.6}>
                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8">
                  <motion.div className="flex items-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                    {" "}
                    {/* Reduced from 1.05 */}
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Create from any topic</span>
                  </motion.div>
                  <motion.div className="flex items-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                    {" "}
                    {/* Reduced from 1.05 */}
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Private course support</span>
                  </motion.div>
                  <motion.div className="flex items-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                    {" "}
                    {/* Reduced from 1.05 */}
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">Track learner progress</span>
                  </motion.div>
                </div>
              </MaskReveal>
            </div>

            <MaskReveal direction="right" delay={0.3}>
              <div className="relative h-[400px] w-full">
                <CTASVG />
              </div>
            </MaskReveal>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CTASection
