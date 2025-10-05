"use client"

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  LogIn, 
  Mail, 
  Github,
  Chrome,
  Shield, 
  Zap,
  Star,
  CheckCircle2,
  ArrowRight,
  X
} from 'lucide-react'

// ============= Types =============

type SignInVariant = 'inline' | 'modal' | 'page' | 'card'
type SignInContext = 'general' | 'quiz' | 'course' | 'pdf' | 'feature'

interface SignInPromptProps {
  variant?: SignInVariant
  context?: SignInContext
  feature?: string
  onSignIn?: () => void
  onClose?: () => void
  callbackUrl?: string
  customMessage?: string
  showBenefits?: boolean
  className?: string
}

// ============= Context Configuration =============

interface ContextConfig {
  title: string
  description: string
  benefits: string[]
  icon: React.ElementType
  color: string
  gradient: string
}

const CONTEXT_CONFIGS: Record<SignInContext, ContextConfig> = {
  general: {
    title: 'Sign in to continue',
    description: 'Access your personalized learning experience',
    benefits: [
      'Track your progress',
      'Save your work',
      'Access premium features',
      'Sync across devices'
    ],
    icon: LogIn,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-500'
  },
  quiz: {
    title: 'Sign in to save your quiz results',
    description: 'Track your learning progress and access detailed analytics',
    benefits: [
      'Save quiz results',
      'Track performance over time',
      'Get detailed analytics',
      'Earn achievements'
    ],
    icon: Star,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-500'
  },
  course: {
    title: 'Sign in to access this course',
    description: 'Continue your learning journey where you left off',
    benefits: [
      'Save course progress',
      'Bookmark videos',
      'Take notes',
      'Get certificates'
    ],
    icon: Shield,
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500'
  },
  pdf: {
    title: 'Sign in to generate PDFs',
    description: 'Export and share your learning materials',
    benefits: [
      'Generate professional PDFs',
      'Share with others',
      'Print materials',
      'Keep offline copies'
    ],
    icon: Zap,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-500'
  },
  feature: {
    title: 'Sign in to unlock this feature',
    description: 'Create an account to access premium functionality',
    benefits: [
      'Unlock premium features',
      'Save unlimited content',
      'Access advanced tools',
      'Priority support'
    ],
    icon: Zap,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-purple-500'
  }
}

// ============= Component =============

export default function SignInPrompt({
  variant = 'inline',
  context = 'general',
  feature,
  onSignIn,
  onClose,
  callbackUrl,
  customMessage,
  showBenefits = true,
  className = ''
}: SignInPromptProps) {
  const router = useRouter()
  const config = CONTEXT_CONFIGS[context]
  const IconComponent = config.icon
  
  // Handle sign in with different providers
  const handleSignIn = useCallback(async (provider: 'google' | 'github' | 'email') => {
    if (onSignIn) {
      onSignIn()
    }
    
    try {
      await signIn(provider, {
        callbackUrl: callbackUrl || window.location.href,
        redirect: true
      })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }, [onSignIn, callbackUrl])
  
  // Handle redirect to signup
  const handleSignUp = useCallback(() => {
    router.push('/auth/signup')
  }, [router])
  
  // Render content
  const renderContent = () => {
    const content = (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${config.gradient} bg-opacity-10`}>
            <IconComponent className={`w-8 h-8 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {customMessage || config.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {config.description}
            </p>
            {feature && (
              <Badge variant="outline" className="mt-2">
                Feature: {feature}
              </Badge>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Benefits */}
        {showBenefits && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Why sign in?
            </p>
            <ul className="space-y-2">
              {config.benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
        
        <Separator />
        
        {/* Sign In Options */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-center">
            Sign in with:
          </p>
          
          {/* Google Sign In */}
          <Button
            onClick={() => handleSignIn('google')}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>
          
          {/* GitHub Sign In */}
          <Button
            onClick={() => handleSignIn('github')}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <Github className="w-5 h-5 mr-2" />
            Continue with GitHub
          </Button>
          
          {/* Email Sign In */}
          <Button
            onClick={() => handleSignIn('email')}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>
          
          <div className="relative">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 px-3 text-sm text-gray-500">
              or
            </span>
          </div>
          
          {/* Sign Up Button */}
          <Button
            onClick={handleSignUp}
            className={`w-full h-12 text-base bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white`}
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Create a free account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {/* Close button for modal */}
          {onClose && variant === 'modal' && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Continue as guest
            </Button>
          )}
        </div>
        
        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Secure
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Instant access
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            Free forever
          </div>
        </div>
      </div>
    )
    
    // Wrap in appropriate container based on variant
    switch (variant) {
      case 'modal':
        return (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget && onClose) {
                  onClose()
                }
              }}
            >
              <Card className={`max-w-md w-full my-auto max-h-[90vh] overflow-y-auto shadow-2xl ${className}`}>
                <CardContent className="p-6">
                  {content}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )
      
      case 'page':
        return (
          <div className={`container max-w-2xl mx-auto py-12 px-4 ${className}`}>
            <Card>
              <CardContent className="p-8">
                {content}
              </CardContent>
            </Card>
          </div>
        )
      
      case 'card':
        return (
          <Card className={`w-full ${className}`}>
            <CardContent className="p-6">
              {content}
            </CardContent>
          </Card>
        )
      
      case 'inline':
      default:
        return (
          <div className={`w-full p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}>
            {content}
          </div>
        )
    }
  }
  
  return renderContent()
}

// ============= Export Named Variants =============

export function SignInPromptModal(props: Omit<SignInPromptProps, 'variant'>) {
  return <SignInPrompt {...props} variant="modal" />
}

export function SignInPromptPage(props: Omit<SignInPromptProps, 'variant'>) {
  return <SignInPrompt {...props} variant="page" />
}

export function SignInPromptCard(props: Omit<SignInPromptProps, 'variant'>) {
  return <SignInPrompt {...props} variant="card" />
}
