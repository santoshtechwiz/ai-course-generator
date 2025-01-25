"use client"

import type React from "react"
import { motion } from "framer-motion"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SignInPromptProps {
  title?: string
  message?: string
  callbackUrl?: string
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  title = "Sign In Required",
  message = "Sign in to view your results and save your progress.",
  callbackUrl = "/dashboard",
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="max-w-md mx-auto mt-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center justify-center text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <motion.svg
              width="100"
              height="100"
              viewBox="0 0 100 100"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <circle cx="50" cy="50" r="40" fill="none" stroke="#6366F1" strokeWidth="4" />
              <motion.path
                d="M30 50 L45 65 L70 40"
                fill="none"
                stroke="#6366F1"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
              />
            </motion.svg>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => signIn(undefined, { callbackUrl })}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Sign In
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

