import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { signIn } from 'next-auth/react'

interface SignInBannerProps {
  isAuthenticated: boolean
}

export function SignInBanner({ isAuthenticated }: SignInBannerProps) {
  const handleSignIn = () => {
    signIn('credentials', { callbackUrl: '/dashboard/mcq' });
  }

  return (
    <AnimatePresence>
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-yellow-100 border-b border-yellow-200 p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <User className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              Sign in to create and save your quizzes
            </span>
          </div>
          <Button
            onClick={handleSignIn}
            variant="outline"
            className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
          >
            Sign In
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

