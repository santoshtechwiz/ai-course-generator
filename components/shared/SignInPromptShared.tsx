"use client"

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"
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
  X,
  Gift,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react'

// ============= Types =============

type SignInVariant = 'inline' | 'modal' | 'page' | 'card'
type SignInContext = 'general' | 'quiz' | 'course' | 'pdf' | 'feature'

interface SignInPromptSharedProps {
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
  ctaText: string
}

const CONTEXT_CONFIGS: Record<SignInContext, ContextConfig> = {
  general: {
    title: 'START LEARNING FOR FREE',
    description: 'Join thousands of learners advancing their skills',
    benefits: [
      'Track progress across courses',
      'Save your favorite content',
      'Earn completion certificates',
      'Access on any device'
    ],
    icon: Sparkles,
    ctaText: 'START FREE'
  },
  quiz: {
    title: 'SAVE YOUR PROGRESS',
    description: 'Sign in to track quiz scores and measure improvement',
    benefits: [
      'Save all quiz attempts',
      'View score history',
      'Compare performance',
      'Get personalized insights'
    ],
    icon: Star,
    ctaText: 'SAVE RESULTS'
  },
  course: {
    title: 'UNLOCK FULL ACCESS',
    description: 'Continue learning with complete course access',
    benefits: [
      'Resume where you left off',
      'Bookmark important lessons',
      'Download resources',
      'Get course certificates'
    ],
    icon: Unlock,
    ctaText: 'ACCESS COURSE'
  },
  pdf: {
    title: 'EXPORT YOUR NOTES',
    description: 'Generate PDFs and take your learning offline',
    benefits: [
      'Create PDF summaries',
      'Export your notes',
      'Print study materials',
      'Share with team'
    ],
    icon: Zap,
    ctaText: 'GENERATE PDF'
  },
  feature: {
    title: 'UNLOCK PREMIUM',
    description: 'Access advanced features and tools',
    benefits: [
      'Advanced analytics',
      'Priority support',
      'Exclusive content',
      'Team collaboration'
    ],
    icon: Lock,
    ctaText: 'UNLOCK NOW'
  }
}

// ============= Component =============

export default function SignInPromptShared({
  variant = 'inline',
  context = 'general',
  feature,
  onSignIn,
  onClose,
  callbackUrl,
  customMessage,
  showBenefits = true,
  className = ''
}: SignInPromptSharedProps) {
  const router = useRouter()
  const config = CONTEXT_CONFIGS[context]
  const IconComponent = config.icon
  
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
  
  const handleSignUp = useCallback(() => {
    router.push('/auth/signup')
  }, [router])
  
  const renderContent = () => {
    const content = (
      <div className="grid lg:grid-cols-2 gap-0 min-h-[500px]">
        {/* LEFT COLUMN - Value Proposition */}
        <div className="bg-primary p-8 lg:p-12 flex flex-col justify-center border-r-0 lg:border-r-4 border-b-4 lg:border-b-0 border-border">
          <div className="space-y-6">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-foreground border-4 border-border shadow-neo">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>

            {/* Headline */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-black uppercase text-primary-foreground leading-tight mb-3">
                {customMessage || config.title}
              </h2>
              <p className="text-lg text-primary-foreground/90 font-medium">
                {config.description}
              </p>
            </div>

            {/* Welcome Bonus */}
            <div className="bg-primary-foreground border-4 border-border shadow-neo p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary border-2 border-border flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-black text-xl text-foreground uppercase mb-1">
                    NEW USER BONUS
                  </div>
                  <div className="text-3xl font-black text-primary mb-2">
                    5 FREE CREDITS
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Get started immediately with 5 credits to explore premium features
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits List */}
            {showBenefits && (
              <div className="space-y-3">
                <div className="font-black text-primary-foreground uppercase text-sm tracking-wider">
                  WHAT YOU GET:
                </div>
                <ul className="space-y-3">
                  {config.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-foreground border-2 border-border flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-primary-foreground font-bold">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature Badge */}
            {feature && (
              <Badge className="bg-primary-foreground text-primary border-2 border-border font-black uppercase">
                {feature}
              </Badge>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Sign In Form */}
        <div className="bg-background p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase text-foreground">
                SIGN IN
              </h3>
              <p className="text-muted-foreground font-medium">
                Choose your preferred method
              </p>
            </div>

            {/* Sign In Buttons */}
            <div className="space-y-4">
              {/* Google */}
              <Button
                onClick={() => handleSignIn('google')}
                variant="outline"
                className="w-full h-14 text-base font-black uppercase border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                size="lg"
              >
                <Chrome className="w-5 h-5 mr-3" />
                GOOGLE
              </Button>

              {/* GitHub */}
              <Button
                onClick={() => handleSignIn('github')}
                variant="outline"
                className="w-full h-14 text-base font-black uppercase border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                size="lg"
              >
                <Github className="w-5 h-5 mr-3" />
                GITHUB
              </Button>

              {/* Email */}
              <Button
                onClick={() => handleSignIn('email')}
                variant="outline"
                className="w-full h-14 text-base font-black uppercase border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                size="lg"
              >
                <Mail className="w-5 h-5 mr-3" />
                EMAIL
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full border-2" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-sm font-bold text-muted-foreground uppercase">
                    OR
                  </span>
                </div>
              </div>

              {/* Create Account - Primary CTA */}
              <Button
                onClick={handleSignUp}
                className="w-full h-16 text-lg font-black uppercase tracking-wider border-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
                size="lg"
              >
                <LogIn className="w-6 h-6 mr-3" />
                {config.ctaText}
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Guest Option */}
              {onClose && variant === 'modal' && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full font-bold uppercase text-sm"
                >
                  CONTINUE AS GUEST
                </Button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 border-t-2 border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <Shield className="w-6 h-6 mx-auto text-foreground" />
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    SECURE
                  </div>
                </div>
                <div className="space-y-1">
                  <Zap className="w-6 h-6 mx-auto text-foreground" />
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    INSTANT
                  </div>
                </div>
                <div className="space-y-1">
                  <Star className="w-6 h-6 mx-auto text-foreground" />
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    FREE
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button for Modal */}
            {onClose && variant === 'modal' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 border-2 border-border bg-background hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )

    // Wrap based on variant
    switch (variant) {
      case 'modal':
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && onClose) {
                onClose()
              }
            }}
          >
            <Card className={cn(
              "max-w-6xl w-full max-h-[90vh] overflow-auto border-4 border-border shadow-neo relative",
              className
            )}>
              {content}
            </Card>
          </div>
        )

      case 'page':
        return (
          <div className={cn("container max-w-6xl mx-auto py-8 px-4", className)}>
            <Card className="border-4 border-border shadow-neo">
              {content}
            </Card>
          </div>
        )

      case 'card':
        return (
          <Card className={cn("w-full border-4 border-border shadow-neo", className)}>
            {content}
          </Card>
        )

      case 'inline':
      default:
        return (
          <div className={cn(
            "w-full border-4 border-border shadow-neo bg-background",
            className
          )}>
            {content}
          </div>
        )
    }
  }

  return renderContent()
}

// ============= Export Named Variants =============

export function SignInPromptModal(props: Omit<SignInPromptSharedProps, 'variant'>) {
  return <SignInPromptShared {...props} variant="modal" />
}

export function SignInPromptPage(props: Omit<SignInPromptSharedProps, 'variant'>) {
  return <SignInPromptShared {...props} variant="page" />
}

export function SignInPromptCard(props: Omit<SignInPromptSharedProps, 'variant'>) {
  return <SignInPromptShared {...props} variant="card" />
}