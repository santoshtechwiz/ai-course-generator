"use client"

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps, Variants } from 'framer-motion'

// Animation variants
const animationVariants: Record<string, Variants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    exit: { opacity: 0, scale: 0.3 }
  }
}

interface AnimatedWrapperProps extends Omit<HTMLMotionProps<"div">, "animate"> {
  animation?: keyof typeof animationVariants | Variants
  delay?: number
  duration?: number
  staggerChildren?: number
  trigger?: boolean
  children: React.ReactNode
}

export function AnimatedWrapper({
  animation = "fadeIn",
  delay = 0,
  duration = 0.3,
  staggerChildren,
  trigger = true,
  children,
  className,
  ...props
}: AnimatedWrapperProps) {
  const variants = typeof animation === "string" ? animationVariants[animation] : animation

  const transition = {
    duration,
    delay,
    staggerChildren,
    ease: [0.25, 0.46, 0.45, 0.94]
  }

  return (
    <motion.div
      className={className}
      initial={trigger ? variants?.initial : false}
      animate={trigger ? variants?.animate : false}
      exit={variants?.exit}
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Pre-built animation components
export const FadeIn: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="fadeIn" {...props} />
)

export const SlideUp: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="slideUp" {...props} />
)

export const SlideDown: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="slideDown" {...props} />
)

export const SlideLeft: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="slideLeft" {...props} />
)

export const SlideRight: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="slideRight" {...props} />
)

export const Scale: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="scale" {...props} />
)

export const Bounce: React.FC<Omit<AnimatedWrapperProps, "animation">> = (props) => (
  <AnimatedWrapper animation="bounce" {...props} />
)

interface StaggeredListProps extends Omit<AnimatedWrapperProps, "animation" | "staggerChildren"> {
  staggerDelay?: number
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  staggerDelay = 0.1,
  children,
  ...props
}) => (
  <AnimatedWrapper
    animation="fadeIn"
    staggerChildren={staggerDelay}
    {...props}
  >
    {children}
  </AnimatedWrapper>
)

// Specialized animation components for flashcard quiz
export const CardFlipAnimation: React.FC<{ isFlipped: boolean } & Omit<AnimatedWrapperProps, "animation">> = ({
  isFlipped,
  children,
  ...props
}) => (
  <motion.div
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
    style={{ transformStyle: "preserve-3d" }}
    {...props}
  >
    {children}
  </motion.div>
)

export const RatingOverlayAnimation: React.FC<{
  rating: "correct" | "incorrect" | "still_learning" | null
} & Omit<AnimatedWrapperProps, "animation">> = ({
  rating,
  children,
  ...props
}) => {
  if (!rating) return null

  const colors = {
    correct: "bg-emerald-500/95 border-emerald-400",
    incorrect: "bg-red-500/95 border-red-400",
    still_learning: "bg-amber-500/95 border-amber-400"
  }

  return (
    <AnimatedWrapper
      animation={{
        initial: { scale: 0.5, opacity: 0, y: 20 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.8, opacity: 0, y: -10 }
      }}
      className={`px-8 py-6 rounded-2xl text-white font-bold text-xl shadow-2xl backdrop-blur-sm border-2 ${colors[rating]}`}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  )
}

export const ParticleEffect: React.FC<{
  count?: number
  color?: string
} & Omit<AnimatedWrapperProps, "animation">> = ({
  count = 6,
  color = "bg-white",
  ...props
}) => (
  <AnimatedWrapper
    animation={{
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }}
    className="absolute inset-0 pointer-events-none"
    {...props}
  >
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        className={`absolute w-2 h-2 rounded-full ${color}`}
        initial={{
          x: "50%",
          y: "50%",
          scale: 0,
          opacity: 0
        }}
        animate={{
          x: `${50 + (Math.random() - 0.5) * 200}%`,
          y: `${50 + (Math.random() - 0.5) * 200}%`,
          scale: [0, 1, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.1,
          ease: "easeOut"
        }}
      />
    ))}
  </AnimatedWrapper>
)