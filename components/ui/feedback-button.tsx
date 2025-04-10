"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"

export type FeedbackState = "idle" | "loading" | "success" | "error"

interface FeedbackButtonProps extends ButtonProps {
  loadingText?: string
  successText?: string
  errorText?: string
  onClickAsync?: () => Promise<boolean>
  feedbackDuration?: number
  showIcon?: boolean
  className?: string
  children: React.ReactNode
}

const APPLE_EASING = [0.25, 0.1, 0.25, 1]

export function FeedbackButton({
  loadingText,
  successText,
  errorText,
  onClickAsync,
  feedbackDuration = 2000,
  showIcon = true,
  className,
  children,
  onClick,
  disabled,
  ...props
}: FeedbackButtonProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle")
  const [buttonText, setButtonText] = useState<React.ReactNode>(children)

  // Reset to idle state after feedback duration
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (feedbackState === "success" || feedbackState === "error") {
      timer = setTimeout(() => {
        setFeedbackState("idle")
        setButtonText(children)
      }, feedbackDuration)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [feedbackState, feedbackDuration, children])

  // Handle button click with async feedback
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick if provided
    if (onClick) {
      onClick(e)
    }

    // If no async handler is provided, just return
    if (!onClickAsync) return

    // Set loading state
    setFeedbackState("loading")
    if (loadingText) setButtonText(loadingText)

    try {
      // Call the async handler
      const success = await onClickAsync()

      // Set success or error state based on result
      if (success) {
        setFeedbackState("success")
        if (successText) setButtonText(successText)
      } else {
        setFeedbackState("error")
        if (errorText) setButtonText(errorText)
      }
    } catch (error) {
      // Set error state on exception
      setFeedbackState("error")
      if (errorText) setButtonText(errorText)
      console.error("Button action failed:", error)
    }
  }

  // Determine button background color based on state
  const getButtonStyles = () => {
    if (feedbackState === "success") {
      return "bg-green-500 hover:bg-green-600 text-white border-green-500"
    }
    if (feedbackState === "error") {
      return "bg-red-500 hover:bg-red-600 text-white border-red-500"
    }
    return ""
  }

  // Render appropriate icon based on state
  const renderIcon = () => {
    if (!showIcon) return null

    switch (feedbackState) {
      case "loading":
        return <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 mr-2" />
      case "error":
        return <XCircle className="h-4 w-4 mr-2" />
      default:
        return null
    }
  }

  return (
    <motion.div
      whileHover={feedbackState === "idle" ? { scale: 1.05 } : {}}
      whileTap={feedbackState === "idle" ? { scale: 0.98 } : {}}
      transition={{ duration: 0.3, ease: APPLE_EASING }}
    >
      <Button
        {...props}
        className={cn(getButtonStyles(), className)}
        disabled={disabled || feedbackState === "loading"}
        onClick={handleClick}
      >
        <span className="flex items-center">
          {renderIcon()}
          {buttonText}
        </span>
      </Button>
    </motion.div>
  )
}
