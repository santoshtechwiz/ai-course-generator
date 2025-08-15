"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Sparkles, Rocket, Brain, PlusCircle, ArrowRight, Zap, Lightbulb, Target, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface CreateCardProps {
  compact?: boolean
  floating?: boolean
  title?: string
  description?: string
  createUrl?: string
  animationDuration?: number
  className?: string
}

export const CreateCard: React.FC<CreateCardProps> = ({
  compact,
  floating,
  title = "Create Your Own Quiz",
  description = "Transform your knowledge into an engaging quiz in minutes! ✨",
  createUrl = "/dashboard/mcq",
  animationDuration = 1.5,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const { theme } = useTheme()

  const [isTouched, setIsTouched] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const animationSpeed = shouldReduceMotion ? 0 : animationDuration

  if (compact) {
    return (
      <Link href={createUrl} passHref>
        <Button
          className={cn(
            "whitespace-nowrap bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 group",
            "relative overflow-hidden rounded-xl",
            "md:px-6 md:py-3",
            "text-base md:text-lg font-semibold",
            "shadow-lg hover:shadow-xl hover:shadow-primary/25",
            "transition-all duration-300 hover:-translate-y-1",
            className,
          )}
          aria-label="Create Quiz"
        >
          <motion.span
            animate={{ rotate: isHovered ? 180 : 0 }}
            transition={{ duration: animationSpeed * 0.2 }}
            className="relative z-10"
          >
            <PlusCircle className="w-4 h-4 mr-2 md:w-5 md:h-5" />
          </motion.span>
          <span className="relative z-10">{title}</span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10"
            initial={{ x: "-100%" }}
            animate={{ x: isHovered ? "100%" : "-100%" }}
            transition={{ duration: animationSpeed * 0.5 }}
          />
        </Button>
      </Link>
    )
  }

  const floatingIcons = [
    { icon: Sparkles, delay: 0, color: "text-yellow-400", bgColor: "bg-yellow-400/20" },
    { icon: Brain, delay: 0.1, color: "text-blue-400", bgColor: "bg-blue-400/20" },
    { icon: Rocket, delay: 0.2, color: "text-purple-400", bgColor: "bg-purple-400/20" },
    { icon: Lightbulb, delay: 0.3, color: "text-green-400", bgColor: "bg-green-400/20" },
  ]

  const cardContent = (
    <CardContent className={cn("text-center p-6 relative overflow-hidden", floating ? "pb-4" : "", "md:p-8")}>
      <AnimatePresence>
        {(isHovered || isTouched) && isMounted && (
          <>
            {floatingIcons.map(({ icon: Icon, delay, color, bgColor }, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-20, -120],
                  x: Math.sin((index * Math.PI) / 2) * 40,
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: animationSpeed,
                  delay: delay * animationSpeed,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: animationSpeed,
                  ease: "easeInOut",
                }}
                className={cn("absolute pointer-events-none", color)}
                style={{
                  left: `${25 + index * 15}%`,
                  bottom: "20%",
                }}
              >
                <div className={cn("p-2 rounded-full", bgColor)}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          rotate: isHovered || isTouched ? 180 : 0,
          scale: isHovered || isTouched ? 1.1 : 1,
        }}
        transition={{ duration: animationSpeed * 0.2, ease: "easeInOut" }}
        className="relative z-10"
      >
        <div className="relative inline-block">
          <div className="relative">
            <PlusCircle
              className={cn(
                "mx-auto mb-4 text-primary",
                floating ? "w-12 h-12" : "w-16 h-16",
                "md:w-20 md:h-20",
              )}
            />
            <motion.div
              animate={{ 
                scale: isHovered || isTouched ? 1.2 : 1,
                rotate: isHovered || isTouched ? 360 : 0,
              }}
              transition={{ duration: animationSpeed * 0.3, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <CardHeader className="p-0">
        <CardTitle className={cn(
          "font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
          floating ? "text-lg md:text-xl" : "text-xl md:text-2xl"
        )}>
          {title}
        </CardTitle>
        {!floating && (
          <CardDescription className="text-muted-foreground mb-6 text-sm md:text-base max-w-xs mx-auto leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <Button
        size={floating ? "default" : "lg"}
        variant="secondary"
        className={cn(
          "group transition-all duration-300",
          "transform hover:scale-105",
          "text-base md:text-lg font-semibold",
          "px-6 py-3 md:px-8 md:py-4",
          "shadow-lg hover:shadow-xl hover:shadow-primary/25",
          "bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white",
          "rounded-xl border-0",
        )}
        aria-label="Start Creating"
      >
        Start Creating
        <motion.span
          className="ml-2 relative"
          animate={{ x: isHovered || isTouched ? 5 : 0 }}
          transition={{ duration: animationSpeed * 0.2 }}
        >
          <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          <motion.div
            animate={{
              opacity: isHovered || isTouched ? 1 : 0,
              x: isHovered || isTouched ? [0, 20] : 0,
            }}
            transition={{
              duration: animationSpeed * 0.3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          </motion.div>
        </motion.span>
      </Button>

      {/* Feature highlights */}
      {!floating && (
        <motion.div 
          className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-green-500" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" />
            <span>Engage Audience</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span>Track Progress</span>
          </div>
        </motion.div>
      )}
    </CardContent>
  )

  const cardWrapper = (
    <Card
      className={cn(
        "h-full flex flex-col justify-center items-center",
        "hover:shadow-xl transition-all duration-300",
        "transform hover:-translate-y-2",
        "bg-background text-foreground border-2 border-border/50",
        "relative overflow-hidden rounded-2xl",
        "hover:border-primary/30",
        className,
      )}
    >
      {cardContent}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none opacity-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered || isTouched ? 1 : 0 }}
        transition={{ duration: animationSpeed * 0.3 }}
      />
    </Card>
  )

  const linkWrapper = (
    <Link href={createUrl} passHref className="block h-full">
      {cardWrapper}
    </Link>
  )

  if (floating) {
    return (
      <motion.div
        className="cursor-pointer"
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {linkWrapper}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      {linkWrapper}
    </motion.div>
  )
}