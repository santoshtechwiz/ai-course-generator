"use client"

import React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquarePlus } from "lucide-react"

interface FeedbackButtonProps extends ButtonProps {
  children?: React.ReactNode
}

export function FeedbackButton({ children, className, variant = "default", ...props }: FeedbackButtonProps) {
  // Using span instead of div when inside a paragraph
  const MotionSpan = motion.span

  return (
    <Button variant={variant} className={className} {...props}>
      <MotionSpan 
        className="inline-flex items-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <MessageSquarePlus className="mr-2 h-4 w-4" />
        {children || "Give Feedback"}
      </MotionSpan>
    </Button>
  )
}
