"use client"

import type React from "react"

import { useState } from "react"
import Image, { type StaticImageData } from "next/image"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { signIn } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface AuthButtonProps {
  provider: string
  logo: string | StaticImageData
  text: string
  callbackUrl: string
}

export function AuthButton({ provider, logo, text, callbackUrl }: AuthButtonProps) {
  const [isButtonLoading, setIsButtonLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsButtonLoading(true)
      // Use signIn directly to ensure the redirect happens
      await signIn(provider.toLowerCase(), { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      toast({
        title: "Authentication failed",
        description: `Failed to sign in with ${provider}. Please try again.`,
        variant: "destructive",
      })
      setIsButtonLoading(false)
    }
    // Note: We don't set isButtonLoading to false here because we're redirecting
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isButtonLoading}
      whileHover={{ scale: isButtonLoading ? 1 : 1.02 }}
      whileTap={{ scale: isButtonLoading ? 1 : 0.98 }}
      className="w-full flex items-center justify-center h-12 px-4 sm:px-6 text-base sm:text-lg font-medium transition-all duration-300 bg-white border-2 border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isButtonLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Image src={logo || "/placeholder.svg"} alt={`${provider} Logo`} width={20} height={20} className="mr-3" />
      )}
      <span className="truncate">{isButtonLoading ? "Signing in..." : text}</span>
    </motion.button>
  )
}
