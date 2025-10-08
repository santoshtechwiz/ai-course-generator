"use client"

import { useSession, signIn } from 'next-auth/react'
import { useSessionContext, type ActionType } from '@/hooks/useSessionContext'
import { useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, Github, Mail } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface ContextualAuthPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionType: ActionType
  actionContext?: string
  onSuccess?: () => void
}

/**
 * ContextualAuthPrompt
 * 
 * Shows authentication prompt with context about why user needs to sign in.
 * Preserves intended action for seamless continuation after auth.
 */
export function ContextualAuthPrompt({
  open,
  onOpenChange,
  actionType,
  actionContext,
  onSuccess
}: ContextualAuthPromptProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { setIntendedAction } = useSessionContext()
  const pathname = usePathname()
  
  const getContextMessage = () => {
    switch (actionType) {
      case 'create_quiz':
        return 'Sign in to create and save your quiz. Access it from any device!'
      case 'create_course':
        return 'Sign in to build your course and share it with learners worldwide.'
      case 'save_progress':
        return 'Sign in to save your progress and pick up right where you left off.'
      case 'enroll_course':
        return 'Sign in to enroll in this course and track your learning journey.'
      case 'generate_pdf':
        return 'Sign in to generate and download your PDF.'
      case 'save_bookmark':
        return 'Sign in to bookmark this content for later.'
      case 'access_analytics':
        return 'Sign in to view detailed analytics and insights.'
      default:
        return 'Sign in to unlock this feature and get the full experience.'
    }
  }
  
  const getActionDescription = () => {
    switch (actionType) {
      case 'create_quiz':
        return actionContext || 'creating your quiz'
      case 'create_course':
        return actionContext || 'building your course'
      case 'save_progress':
        return 'saving your progress'
      case 'enroll_course':
        return 'enrolling in this course'
      case 'generate_pdf':
        return 'generating your PDF'
      case 'save_bookmark':
        return 'saving this bookmark'
      case 'access_analytics':
        return 'viewing analytics'
      default:
        return 'accessing this feature'
    }
  }
  
  const handleSignIn = async (provider: 'github' | 'google') => {
    setIsAuthenticating(true)
    
    // Store intended action
    if (actionType) {
      setIntendedAction({
        type: actionType,
        context: { actionContext },
        timestamp: Date.now(),
        returnUrl: pathname,
        description: getActionDescription()
      })
    }
    
    try {
      await signIn(provider, {
        callbackUrl: pathname
      })
    } catch (error) {
      console.error('Authentication error:', error)
      setIsAuthenticating(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">Sign In Required</DialogTitle>
            <DialogDescription className="mt-2">
              {getContextMessage()}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => handleSignIn('github')}
            disabled={isAuthenticating}
            className="w-full"
            variant="outline"
          >
            <Github className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>
          
          <Button
            onClick={() => handleSignIn('google')}
            disabled={isAuthenticating}
            className="w-full"
            variant="outline"
          >
            <Mail className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground pt-2">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * useContextualAuth Hook
 * 
 * Provides a function to check authentication and show contextual prompt if needed
 */
export function useContextualAuth() {
  const { status } = useSession()
  const [authPrompt, setAuthPrompt] = useState<{
    open: boolean
    actionType: ActionType
    actionContext?: string
  }>({
    open: false,
    actionType: null,
    actionContext: undefined
  })
  
  const requireAuth = useCallback((
    actionType: ActionType,
    actionContext?: string
  ): boolean => {
    if (status === 'authenticated') {
      return true
    }
    
    // Show auth prompt
    setAuthPrompt({
      open: true,
      actionType,
      actionContext
    })
    
    return false
  }, [status])
  
  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt(prev => ({ ...prev, open: false }))
  }, [])
  
  return {
    requireAuth,
    authPrompt,
    closeAuthPrompt,
    isAuthenticated: status === 'authenticated'
  }
}
