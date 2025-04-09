"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient: string
  delay?: number
}

const FeatureCard = ({ icon: Icon, title, description, gradient, delay = 0 }: FeatureCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      }}
      className="h-full bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/10 transition-all duration-300 relative overflow-hidden group"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Enhanced background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 0.08 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Enhanced icon animation */}
      <motion.div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}
        whileHover={{
          scale: 1.1,
          rotate: [0, 5, -5, 0],
          transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
          },
        }}
      >
        <Icon className="h-7 w-7 text-white" />
      </motion.div>

      {/* Content with enhanced typography */}
      <motion.h3
        className="text-xl font-semibold mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          duration: 0.5,
          delay: delay + 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-muted-foreground leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          duration: 0.5,
          delay: delay + 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

export default FeatureCard
