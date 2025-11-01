"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface AnimatedCourseAILogoProps {
  animated?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  position?: "inline" | "floating"
  floating?: boolean  // Backward compat
}

const AnimatedCourseAILogo: React.FC<AnimatedCourseAILogoProps> = ({
  animated = false,
  className,
  size = "md",
  position = "inline",
  floating = false
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFloating = floating || position === "floating";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  };

  // Ensure floating styles are applied correctly
  const floatingClasses = isFloating ? "fixed bottom-6 right-6 z-40 shadow-2xl pointer-events-auto will-change-transform" : "";

  const variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 }
    }
  };

  const pulseVariants = {
    pulse: {
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };

  // For floating mode, render immediately after mount on client
  if (isFloating) {
    if (!mounted) return null;
    
    return (
      <motion.div 
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500",
          sizeClasses[size],
          floatingClasses,
          "border-2 border-white backdrop-blur-sm cursor-help hover:shadow-2xl"
        )}
        initial="hidden"
        animate={animated ? ["visible", "pulse"] : "visible"}
        variants={{...variants, ...pulseVariants}}
        whileHover="hover"
        title="CourseAI - Learn with AI"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        <div className={cn("text-white font-black uppercase tracking-wider", textSizeClasses[size])}>
          AI
        </div>
      </motion.div>
    );
  }

  // Inline mode (always render)
  return (
    <div className={cn(
      "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600",
      sizeClasses[size],
      animated && "animate-pulse",
      className
    )}>
      <div className={cn("text-white font-bold", textSizeClasses[size])}>
        AI
      </div>
    </div>
  )
}

export default AnimatedCourseAILogo
