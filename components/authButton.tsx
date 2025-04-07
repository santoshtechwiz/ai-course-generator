"use client"

import { Suspense, useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"

interface AuthButtonProps {
  provider: string
  logo: string | StaticImageData
  text: string
  callbackUrl: string
}

export function AuthButton({ provider, logo, text, callbackUrl }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)
      await signIn(provider?.toLowerCase(), { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Suspense fallback={<div className="h-12 bg-gray-200 rounded-lg animate-pulse" />}>
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center h-12 px-4 sm:px-6 text-base sm:text-lg font-medium transition-all duration-300 bg-white border-2 border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image src={logo || "/placeholder.svg"} alt={`${provider} Logo`} width={20} height={20} className="mr-3" />
        <span className="truncate">{isLoading ? "Signing in..." : text}</span>
      </motion.button>
    </Suspense>
  )
}

