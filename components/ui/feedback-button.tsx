"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

import { CheckCircle, XCircle, MessageSquarePlus } from "lucide-react"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/tailwindUtils"

export type FeedbackState = "idle" | "loading" | "success" | "error"

// Ensure ButtonProps is imported or defined
import { Button, type ButtonProps } from "@/components/ui/button" // Adjust the path as needed

interface FeedbackButtonProps extends ButtonProps {
  loadingText?: React.ReactNode
  successText?: React.ReactNode
  errorText?: React.ReactNode
  onClickAsync?: () => Promise<boolean | void>
  feedbackDuration?: number
  showIcon?: boolean
  resetOnSuccess?: boolean
  resetOnError?: boolean
  className?: string
  children: React.ReactNode
}

const DEFAULT_EASING = [0.25, 0.1, 0.25, 1]

export function FeedbackButton({
  loadingText,
  successText,
  errorText,
  onClickAsync,
  feedbackDuration = 2000,
  showIcon = true,
  resetOnSuccess = true,
  resetOnError = true,
  className,
  children,
  onClick,
  disabled,
  variant = "default",
  size,
  ...props
}: FeedbackButtonProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("idle")
  const [buttonText, setButtonText] = useState<React.ReactNode>(children)
  const ref = useRef<HTMLButtonElement>(null)

  // Reset to idle state after feedback duration
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (feedbackState === "success" && resetOnSuccess) {
      timer = setTimeout(() => {
        setFeedbackState("idle")
        setButtonText(children)
      }, feedbackDuration)
    }

    if (feedbackState === "error" && resetOnError) {
      timer = setTimeout(() => {
        setFeedbackState("idle")
        setButtonText(children)
      }, feedbackDuration)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [feedbackState, feedbackDuration, children, resetOnSuccess, resetOnError])

  // Handle button click with async feedback
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e)
    }

    if (!onClickAsync) return

    try {
      // Set loading state
      setFeedbackState("loading")
      if (loadingText) setButtonText(loadingText)

      // Call the async handler
      const result = await onClickAsync()

      // Only update state if the promise returned a boolean
      if (typeof result === "boolean") {
        if (result) {
          setFeedbackState("success")
          if (successText) setButtonText(successText)
        } else {
          setFeedbackState("error")
          if (errorText) setButtonText(errorText)
        }
      }
    } catch (error) {
      setFeedbackState("error")
      if (errorText) setButtonText(errorText)
      console.error("Button action failed:", error)
    }
  }

  // Determine button styling based on state
  const getButtonStyles = () => {
    switch (feedbackState) {
      case "success":
        return "bg-green-500 hover:bg-green-600 text-white border-green-500"
      case "error":
        return "bg-red-500 hover:bg-red-600 text-white border-red-500"
      default:
        return ""
    }
  }

  // Render appropriate icon based on state
  const renderIcon = () => {
    if (!showIcon) return null

    switch (feedbackState) {
      case "loading":
        return <GlobalLoader size="xs" className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  // Check if we're inside a <p> tag and add warning in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const button = ref.current
      if (button) {
        let parent = button.parentElement
        while (parent) {
          if (parent.tagName.toLowerCase() === "p") {
            console.warn(
              "FeedbackButton is inside a <p> tag. This may cause hydration errors. Consider wrapping the parent text in a <span> instead."
            )
            break
          }
          parent = parent.parentElement
        }
      }
    }
  }, [])

  return (
    <motion.span
      whileHover={feedbackState === "idle" ? { scale: 1.05 } : {}}
      whileTap={feedbackState === "idle" ? { scale: 0.98 } : {}}
      transition={{ duration: 0.3, ease: DEFAULT_EASING }}
      className="inline-flex" // Keep inline-flex for proper button sizing
    >
      <Button
        ref={ref}
        {...props}
        className={cn(
          "transition-colors duration-200",
          getButtonStyles(),
          className,
        )}
        disabled={disabled || feedbackState === "loading"}
        onClick={handleClick}
        variant={variant}
        size={size}
      >
        <span className="flex items-center justify-center gap-2">
          {renderIcon()}
          {buttonText}
        </span>
      </Button>
    </motion.span>
  )
}
