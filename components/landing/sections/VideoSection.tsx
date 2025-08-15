"use client"

import React from "react"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const RevealAnimation: React.FC<{ delay?: number; className?: string; children: React.ReactNode }> = ({ delay = 0, className, children }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ delay, duration: 0.4 }}
  >
    {children}
  </motion.div>
)

const VideoSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      title: "Tech-Savvy & Minimal",
      description: "Your AI-Powered Coding Coach.",
      subtext: "Generate tailored coding quizzes in seconds. Learn by doing.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Student-Focused",
      description: "Practice Smarter, Not Harder.",
      subtext: "Build confidence with AI-generated coding questions that challenge and teach.",
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "Feature-Driven",
      description: "Custom Coding MCQs, Powered by AI.",
      subtext: "Practice with questions tailored to your level, language, and goals.",
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "One-Liner Vibe",
      description: "Turn AI into your coding tutor.",
      subtext: "Just pick a topic — we'll generate the questions.",
      color: "from-emerald-500 to-green-500",
    },
  ]

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleFeatureChange = (index: number) => {
    setActiveFeature(index)
  }

  // Auto-rotate features
  React.useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isInView, features.length])

  return (
    <div
      ref={containerRef}
      className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-muted/20"
    >
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <RevealAnimation>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Smarter Coding. Faster Learning.</h2>
          </RevealAnimation>

          <RevealAnimation delay={0.1}>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              AI-generated coding questions to level up your skills — instantly.
            </p>
          </RevealAnimation>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Video Player */}
          <RevealAnimation delay={0.2} className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/placeholder.svg?height=720&width=1280&text=AI+Coding+Coach"
                muted
                playsInline
                loop
              >
                <source src="/your-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Overlay with Apple-style gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>

              {/* Apple-style play button overlay */}
              {!isPlaying && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={togglePlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="h-10 w-10 text-white" />
                  </motion.div>
                </motion.div>
              )}

              {/* Feature badge */}
              <div className="absolute top-4 left-4">
                <Badge
                  className="px-3 py-1.5 text-sm bg-primary/80 backdrop-blur-sm text-white border-none"
                  variant="outline"
                >
                  AI Coding Coach
                </Badge>
              </div>
            </div>
          </RevealAnimation>

          {/* Feature Showcase */}
          <div className="order-1 lg:order-2">
            <RevealAnimation delay={0.3}>
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "p-6 rounded-xl transition-all cursor-pointer",
                      activeFeature === index
                        ? "bg-card/30 backdrop-blur-sm border border-border/10 shadow-lg"
                        : "hover:bg-card/10",
                    )}
                    onClick={() => handleFeatureChange(index)}
                    whileHover={{ x: activeFeature === index ? 0 : 5 }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                          `bg-gradient-to-br ${feature.color}`,
                        )}
                      >
                        <span className="text-sm font-bold">🔹</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                        <p className="text-base font-medium mb-2">{feature.description}</p>
                        <p className="text-sm text-muted-foreground">{feature.subtext}</p>

                        {activeFeature === index && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                            <Button variant="ghost" size="sm" className="px-0 text-primary">
                              Learn more
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </RevealAnimation>
          </div>
        </div>

        {/* Feature Indicators */}
        <div className="flex justify-center mt-12 space-x-2">
          {features.map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === activeFeature ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => handleFeatureChange(index)}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
    </div>
  )
}

export default VideoSection
