"use client"

import { ReactNode, forwardRef } from 'react'
import { motion, HTMLMotionProps, Variants } from 'framer-motion'

interface AnimatedWrapperProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce' | 'none'
  delay?: number
  duration?: number
  staggerChildren?: number
  once?: boolean
  className?: string
}

// Common animation variants
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
        stiffness: 260,
        damping: 20
      }
    },
    exit: { opacity: 0, scale: 0.3 }
  },
  none: {
    initial: {},
    animate: {},
    exit: {}
  }
}

export const AnimatedWrapper = forwardRef<HTMLDivElement, AnimatedWrapperProps>(
  ({
    children,
    animation = 'fadeIn',
    delay = 0,
    duration = 0.3,
    staggerChildren = 0,
    once = true,
    className = '',
    ...motionProps
  }, ref) => {
    const variants = animationVariants[animation]

    const transition = {
      duration,
      delay,
      staggerChildren,
      ease: "easeOut",
      ...motionProps.transition
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        whileInView={once ? "animate" : undefined}
        viewport={{ once, amount: 0.3 }}
        {...motionProps}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedWrapper.displayName = 'AnimatedWrapper'

// Specialized animation components
export const FadeIn = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, 'animation'>>(
  (props, ref) => <AnimatedWrapper ref={ref} animation="fadeIn" {...props} />
)
FadeIn.displayName = 'FadeIn'

export const SlideUp = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, 'animation'>>(
  (props, ref) => <AnimatedWrapper ref={ref} animation="slideUp" {...props} />
)
SlideUp.displayName = 'SlideUp'

export const SlideDown = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, 'animation'>>(
  (props, ref) => <AnimatedWrapper ref={ref} animation="slideDown" {...props} />
)
SlideDown.displayName = 'SlideDown'

export const Scale = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, 'animation'>>(
  (props, ref) => <AnimatedWrapper ref={ref} animation="scale" {...props} />
)
Scale.displayName = 'Scale'

export const Bounce = forwardRef<HTMLDivElement, Omit<AnimatedWrapperProps, 'animation'>>(
  (props, ref) => <AnimatedWrapper ref={ref} animation="bounce" {...props} />
)
Bounce.displayName = 'Bounce'

// Staggered list animation
interface StaggeredListProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggeredList({ children, staggerDelay = 0.1, className = '' }: StaggeredListProps) {
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  }

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
