"use client"

import { Suspense, useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"

interface AuthButtonProps {
  provider: string
  logo: string
  text: string
  callbackUrl: string
}

export function AuthButton({ provider, logo, text, callbackUrl }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)
      await signIn(provider.toLowerCase(), { callbackUrl })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Suspense fallback={<>Loading...</>}>
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full flex items-center justify-center h-12 px-6 mt-4 text-lg font-medium transition-colors duration-300 bg-white border-2 border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image src={logo} alt={`${provider} Logo`} width={24} height={24} className="mr-3" />
        {isLoading ? "Signing in..." : text}
      </motion.button>
    </Suspense>
  )
}

