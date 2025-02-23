"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Sparkles, Rocket, Brain, PlusCircle, ArrowRight, Zap, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

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
  createUrl = "/dashboard/quiz",
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
            "whitespace-nowrap bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 group",
            "relative overflow-hidden",
            "md:px-6 md:py-3",
            "text-base md:text-lg",
            className,
          )}
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
            className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30"
            initial={{ x: "-100%" }}
            animate={{ x: isHovered ? "100%" : "-100%" }}
            transition={{ duration: animationSpeed * 0.5 }}
          />
        </Button>
      </Link>
    )
  }

  const floatingIcons = [
    { icon: Sparkles, delay: 0, color: "text-yellow-300" },
    { icon: Brain, delay: 0.1, color: "text-blue-300" },
    { icon: Rocket, delay: 0.2, color: "text-purple-300" },
    { icon: Lightbulb, delay: 0.3, color: "text-green-300" },
  ]

  const cardContent = (
    <CardContent className={cn("text-center p-6 relative overflow-hidden", floating ? "pb-4" : "", "md:p-8")}>
      <AnimatePresence>
        {(isHovered || isTouched) && isMounted && (
          <>
            {floatingIcons.map(({ icon: Icon, delay, color }, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-20, -100],
                  x: Math.sin((index * Math.PI) / 2) * 30,
                }}
                transition={{
                  duration: animationSpeed,
                  delay: delay * animationSpeed,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: animationSpeed,
                }}
                className={cn("absolute pointer-events-none", color)}
                style={{
                  left: `${25 + index * 15}%`,
                  bottom: "20%",
                }}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
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
        transition={{ duration: animationSpeed * 0.2 }}
        className="relative z-10"
      >
        <div className="relative inline-block">
          <PlusCircle
            className={cn(
              "mx-auto mb-4 text-primary-foreground",
              floating ? "w-12 h-12" : "w-16 h-16",
              "md:w-20 md:h-20",
            )}
          />
          <motion.div
            animate={{ scale: isHovered || isTouched ? 1.2 : 1 }}
            transition={{ duration: animationSpeed * 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-300" />
          </motion.div>
        </div>
      </motion.div>

      <h3
        className={cn(
          "font-semibold mb-2 text-primary-foreground",
          floating ? "text-lg md:text-xl" : "text-xl md:text-2xl",
        )}
      >
        {title}
      </h3>

      {!floating && (
        <p className="text-primary-foreground/90 mb-6 text-sm md:text-base max-w-xs mx-auto">{description}</p>
      )}

      <Button
        size={floating ? "default" : "lg"}
        variant="secondary"
        className={cn(
          "group transition-all duration-300",
          "transform hover:scale-105",
          "text-base md:text-lg",
          "px-6 py-3 md:px-8 md:py-4",
          "shadow-lg hover:shadow-xl",
        )}
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
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <Zap className="w-5 h-5 md:w-6 md:h-6" />
          </motion.div>
        </motion.span>
      </Button>
    </CardContent>
  )

  const cardWrapper = (
    <Card
      className={cn(
        "h-full flex flex-col justify-center items-center",
        "hover:shadow-xl transition-all duration-300",
        "transform hover:-translate-y-2",
        "bg-gradient-to-br from-primary via-primary to-primary/90",
        "text-primary-foreground border-2 border-primary-foreground/10",
        "relative overflow-hidden",
        className,
      )}
    >
      {cardContent}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 pointer-events-none"
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {linkWrapper}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
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

