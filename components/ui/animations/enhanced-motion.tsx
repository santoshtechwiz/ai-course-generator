"use client"

import { motion, type Variants, type Transition } from "framer-motion"
import { cn } from "@/lib/utils"

// Enhanced animation variants for consistent motion throughout the app
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.68, -0.55, 0.265, 1.55],
    }
  }
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

// Stagger children animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

// Hover animations
export const hoverScale: Variants = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
}

export const hoverLift: Variants = {
  hover: { 
    y: -8,
    transition: { duration: 0.3 }
  },
  tap: { 
    y: -4,
    transition: { duration: 0.1 }
  }
}

export const hoverGlow: Variants = {
  hover: { 
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: { duration: 0.3 }
  }
}

// Enhanced motion components
interface EnhancedMotionProps {
  children: React.ReactNode
  variants?: Variants
  initial?: string | boolean
  animate?: string | boolean
  exit?: string | boolean
  transition?: Transition
  className?: string
  [key: string]: any
}

export const EnhancedMotion: React.FC<EnhancedMotionProps> = ({
  children,
  variants,
  initial = "hidden",
  animate = "visible",
  exit,
  transition,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Specialized motion components
export const FadeInUp = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={fadeInUp} {...props}>
    {children}
  </EnhancedMotion>
)

export const FadeInDown = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={fadeInDown} {...props}>
    {children}
  </EnhancedMotion>
)

export const FadeInLeft = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={fadeInLeft} {...props}>
    {children}
  </EnhancedMotion>
)

export const FadeInRight = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={fadeInRight} {...props}>
    {children}
  </EnhancedMotion>
)

export const ScaleIn = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={scaleIn} {...props}>
    {children}
  </EnhancedMotion>
)

export const BounceIn = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={bounceIn} {...props}>
    {children}
  </EnhancedMotion>
)

export const SlideUp = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={slideUp} {...props}>
    {children}
  </EnhancedMotion>
)

export const SlideDown = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={slideDown} {...props}>
    {children}
  </EnhancedMotion>
)

export const StaggerContainer = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={staggerContainer} {...props}>
    {children}
  </EnhancedMotion>
)

export const StaggerItem = ({ children, ...props }: EnhancedMotionProps) => (
  <EnhancedMotion variants={staggerItem} {...props}>
    {children}
  </EnhancedMotion>
)

// Interactive motion components
export const InteractiveMotion: React.FC<EnhancedMotionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={hoverScale}
      whileHover="hover"
      whileTap="tap"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const LiftMotion: React.FC<EnhancedMotionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={hoverLift}
      whileHover="hover"
      whileTap="tap"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const GlowMotion: React.FC<EnhancedMotionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      variants={hoverGlow}
      whileHover="hover"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}