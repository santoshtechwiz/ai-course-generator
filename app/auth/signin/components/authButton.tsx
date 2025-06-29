"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image, { type StaticImageData } from "next/image"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: string
  logo: string | StaticImageData
  text: string
  callbackUrl: string
  onClick?: (e: React.MouseEvent) => Promise<void>
  className?: string
}

export function AuthButton({
  provider,
  logo,
  text,
  callbackUrl,
  onClick,
  className,
  ...props
}: AuthButtonProps) {
  const [isButtonLoading, setIsButtonLoading] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const isClickInProgress = useRef(false)

  const handleClick = async (e: React.MouseEvent) => {
    if (isButtonLoading || isClickInProgress.current) return

    if (onClick) {
      return onClick(e)
    }

    e.preventDefault()
    e.stopPropagation()

    isClickInProgress.current = true
    setIsButtonLoading(true)

    try {
      if (!provider || typeof provider !== "string") {
        throw new Error("Invalid authentication provider")
      }

      const safeCallbackUrl =
        callbackUrl && typeof callbackUrl === "string" ? callbackUrl : "/dashboard"

      await login(provider.toLowerCase(), { callbackUrl: safeCallbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      toast({
        title: "Authentication failed",
        description: `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setIsButtonLoading(false)
      isClickInProgress.current = false
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isButtonLoading}
      whileHover={{ scale: isButtonLoading ? 1 : 1.02 }}
      whileTap={{ scale: isButtonLoading ? 1 : 0.98 }}
      className={cn(
        "w-full flex items-center justify-center gap-4 h-12 px-6",
        "text-base font-medium transition-all duration-300",
        "bg-background border border-input text-foreground rounded-md",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isButtonLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Image
          src={logo || "/placeholder.svg"}
          alt={`${provider} Logo`}
          width={24}
          height={24}
          className="size-6 object-contain"
          unoptimized={typeof logo === "string" && logo.startsWith("/")}
        />
      )}
      <span className="truncate">{isButtonLoading ? "Signing in..." : text}</span>
    </motion.button>
  )
}