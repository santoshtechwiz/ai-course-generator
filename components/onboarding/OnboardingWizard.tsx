/**
 * User Onboarding Wizard
 * 
 * Multi-step onboarding flow:
 * 1. Welcome - Introduction to the platform
 * 2. Interests - Select topics of interest
 * 3. First Action - Choose how to start (create/explore)
 * 4. Quick Tour - Interactive product tour
 * 
 * Progress is saved to localStorage for resumption
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Brain,
  Code,
  Palette,
  Globe,
  TrendingUp,
  Rocket,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const ONBOARDING_STORAGE_KEY = 'courseai_onboarding_progress'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<StepProps>
}

interface StepProps {
  onNext: (data?: any) => void
  onBack: () => void
  onSkip: () => void
  savedData?: any
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onDismiss?: () => void
}

interface OnboardingData {
  interests: string[]
  firstAction: 'create' | 'explore' | 'learn'
  tourCompleted: boolean
}

// Available interest categories
const INTEREST_CATEGORIES = [
  { id: 'programming', label: 'Programming', icon: Code, color: 'text-blue-500' },
  { id: 'design', label: 'Design', icon: Palette, color: 'text-purple-500' },
  { id: 'business', label: 'Business', icon: TrendingUp, color: 'text-green-500' },
  { id: 'languages', label: 'Languages', icon: Globe, color: 'text-orange-500' },
  { id: 'science', label: 'Science', icon: Brain, color: 'text-cyan-500' },
  { id: 'literature', label: 'Literature', icon: BookOpen, color: 'text-pink-500' },
]

// Step 1: Welcome
function WelcomeStep({ onNext, onSkip }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground border-4 border-primary-foreground shadow-[6px_6px_0px_hsl(var(--border))]"
      >
        <Rocket className="w-12 h-12" />
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Welcome to CourseAI! 🎉</h2>
        <p className="text-base text-muted-foreground max-w-md mx-auto">
          Let's get you started on your learning journey. This will only take a minute.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
        <Card className="border-2">
          <CardContent className="p-4 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Smart quizzes and personalized learning paths
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Adaptive</h3>
            <p className="text-sm text-muted-foreground">
              Difficulty adjusts to your skill level
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              See your improvement over time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 justify-center pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip Setup
        </Button>
        <Button size="lg" onClick={() => onNext()} className="gap-2">
          Let's Go
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 2: Select Interests
function InterestsStep({ onNext, onBack, savedData }: StepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(savedData?.interests || [])

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (selectedInterests.length > 0) {
      onNext({ interests: selectedInterests })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What are you interested in?</h2>
        <p className="text-muted-foreground">
          Select topics you'd like to learn. We'll personalize your experience.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {INTEREST_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isSelected = selectedInterests.includes(category.id)

          return (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all border-2',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-muted hover:border-primary/50'
                )}
                onClick={() => toggleInterest(category.id)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div
                    className={cn(
                      'w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-colors',
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    )}
                  >
                    <Icon className={cn('w-6 h-6', isSelected ? 'text-primary' : category.color)} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{category.label}</h3>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 text-xs text-primary"
                      >
                        <Check className="w-3 h-3" />
                        Selected
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {selectedInterests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground"
        >
          {selectedInterests.length} {selectedInterests.length === 1 ? 'topic' : 'topics'} selected
        </motion.div>
      )}

      <div className="flex gap-3 justify-center pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={selectedInterests.length === 0}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 3: Choose First Action
function FirstActionStep({ onNext, onBack, savedData }: StepProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(savedData?.firstAction || null)

  const actions = [
    {
      id: 'explore',
      title: 'Explore Courses',
      description: 'Browse our catalog of courses and quizzes',
      icon: Globe,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'create',
      title: 'Create Content',
      description: 'Start building your own courses and quizzes',
      icon: Sparkles,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'learn',
      title: 'Start Learning',
      description: 'Jump into a quick quiz to test your knowledge',
      icon: Brain,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ]

  const handleNext = () => {
    if (selectedAction) {
      onNext({ firstAction: selectedAction })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">How would you like to start?</h2>
        <p className="text-muted-foreground">Choose your first action on the platform</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {actions.map((action) => {
          const Icon = action.icon
          const isSelected = selectedAction === action.id

          return (
            <motion.div key={action.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card
                className={cn(
                  'cursor-pointer transition-all border-2 h-full',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-muted hover:border-primary/50'
                )}
                onClick={() => setSelectedAction(action.id)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={cn('w-16 h-16 mx-auto rounded-2xl flex items-center justify-center', isSelected ? action.bg : 'bg-muted')}>
                    <Icon className={cn('w-8 h-8', isSelected ? action.color : 'text-muted-foreground')} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      Selected
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-3 justify-center pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!selectedAction}
          className="gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 4: Complete
function CompleteStep({ onNext }: StepProps) {
  const router = useRouter()

  const handleFinish = (action: string) => {
    onNext({ tourCompleted: true, navigateTo: action })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success text-success-foreground"
      >
        <Check className="w-12 h-12" />
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold">You're all set! 🎉</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your personalized learning experience is ready. Let's start your journey!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button size="lg" onClick={() => handleFinish('dashboard')} variant="outline">
          Go to Dashboard
        </Button>
        <Button size="lg" onClick={() => handleFinish('explore')} className="gap-2">
          Start Exploring
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Main Onboarding Wizard Component
export default function OnboardingWizard({ onComplete, onDismiss }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({})

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with CourseAI',
      component: WelcomeStep,
    },
    {
      id: 'interests',
      title: 'Interests',
      description: 'Select your topics',
      component: InterestsStep,
    },
    {
      id: 'first-action',
      title: 'First Action',
      description: 'Choose how to start',
      component: FirstActionStep,
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'All done!',
      component: CompleteStep,
    },
  ]

  const currentStepData = steps[currentStep]
  const StepComponent = currentStepData.component
  const progress = ((currentStep + 1) / steps.length) * 100

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setOnboardingData(data)
        setCurrentStep(data.currentStep || 0)
      } catch (error) {
        console.error('Error loading onboarding progress:', error)
      }
    }
  }, [])

  // Save progress
  useEffect(() => {
    if (Object.keys(onboardingData).length > 0) {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({ ...onboardingData, currentStep })
      )
    }
  }, [onboardingData, currentStep])

  const handleNext = (stepData?: any) => {
    const updatedData = { ...onboardingData, ...stepData }
    setOnboardingData(updatedData)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      localStorage.removeItem(ONBOARDING_STORAGE_KEY)
      onComplete(updatedData as OnboardingData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    onComplete({
      interests: [],
      firstAction: 'explore',
      tourCompleted: false,
    })
  }

  const handleDismiss = () => {
    onDismiss?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Setup Your Account</CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length}: {currentStepData.description}
              </CardDescription>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="absolute top-6 right-6"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <StepComponent
              key={currentStepData.id}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              savedData={onboardingData}
            />
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
