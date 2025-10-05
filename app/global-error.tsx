"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  Home,
  RefreshCw,
  ArrowLeft,
  Bug,
  Zap,
  Shield,
  MessageSquare,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen
} from "lucide-react"
import { UnifiedLoader } from "@/components/loaders/UnifiedLoader"
import {
  FADE,
  SLIDE_UP,
  SCALE,
  getStaggeredContainerAnimation,
  getStaggeredAnimation
} from "@/components/ui/animations/animation-presets"
import { cn } from "@/lib/utils"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

type RecoveryState = 'idle' | 'retrying' | 'success' | 'failed'

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter()
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle')
  const [retryCount, setRetryCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // Filter out AbortErrors - these are expected and shouldn't show error UI
  const isAbortError = error?.name === 'AbortError' ||
                      error?.message?.includes('signal is aborted') ||
                      error?.message?.includes('aborted without reason')

  // Enhanced error logging (but don't log AbortErrors as errors)
  useEffect(() => {
    if (isAbortError) {
      // Just log AbortErrors as info, not errors
      console.info("ℹ️ Request cancelled (AbortError):", {
        message: error.message,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      })
    } else {
      console.error("🚨 Global error occurred:", {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      })
    }
  }, [error, isAbortError])

  // Don't show error UI for AbortErrors - let the app continue normally
  if (isAbortError) {
    return null
  }

  // Simulate progress during retry
  useEffect(() => {
    if (recoveryState === 'retrying') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [recoveryState])

  const handleReset = async () => {
    setRecoveryState('retrying')
    setProgress(0)
    setRetryCount(prev => prev + 1)

    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000))
      reset()
      setRecoveryState('success')

      // Auto-redirect after success
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (retryError) {
      console.error("Retry failed:", retryError)
      setRecoveryState('failed')
      setProgress(0)
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      router.push("/")
    }
  }

  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return { type: 'network', icon: Zap, color: 'text-yellow-500' }
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return { type: 'auth', icon: Shield, color: 'text-blue-500' }
    }
    return { type: 'unknown', icon: Bug, color: 'text-red-500' }
  }

  const errorInfo = getErrorType(error)
  const ErrorIcon = errorInfo.icon

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-destructive/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-2xl relative z-10"
        variants={FADE}
        initial="initial"
        animate="animate"
      >
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center border-b pb-8 space-y-6 relative">
            {/* Animated Error Icon */}
            <motion.div
              className="mx-auto relative"
              variants={SCALE}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <motion.div
                  className="absolute inset-0 bg-destructive/10 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ErrorIcon className={cn("h-12 w-12", errorInfo.color)} />
                </div>
                <motion.div
                  className="absolute inset-0 border-2 border-destructive/20 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>

            <motion.div
              variants={SLIDE_UP}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-muted-foreground text-lg mt-2">
                We're sorry for the inconvenience. Our team has been notified.
              </p>
            </motion.div>

            {/* Error Type Badge */}
            <motion.div
              variants={SLIDE_UP}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
            >
              <Badge variant="outline" className="text-sm px-3 py-1">
                <ErrorIcon className="h-3 w-3 mr-1" />
                {errorInfo.type.charAt(0).toUpperCase() + errorInfo.type.slice(1)} Error
              </Badge>
            </motion.div>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            {/* Recovery State Display */}
            <AnimatePresence mode="wait">
              {recoveryState === 'retrying' && (
                <motion.div
                  key="retrying"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-3">
                    <UnifiedLoader
                      state="loading"
                      variant="spinner"
                      size="md"
                      message="Attempting to recover..."
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recovery Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Attempt {retryCount} of 3
                  </p>
                </motion.div>
              )}

              {recoveryState === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center space-y-4"
                >
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <p className="text-green-600 font-medium">Recovery successful!</p>
                  <p className="text-sm text-muted-foreground">Redirecting you shortly...</p>
                </motion.div>
              )}

              {recoveryState === 'failed' && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Recovery Failed</AlertTitle>
                    <AlertDescription>
                      We couldn't automatically fix this issue. Please try the options below.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Details (Collapsible) */}
            {error.message && (
              <motion.div
                variants={SLIDE_UP}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Error Details
                  </span>
                  <motion.div
                    animate={{ rotate: showDetails ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.div>
                </Button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Technical Details</AlertTitle>
                        <AlertDescription className="mt-2 break-words font-mono text-xs">
                          {error.message}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Development Info */}
            {process.env.NODE_ENV === "development" && error.digest && (
              <motion.div
                variants={SLIDE_UP}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.6 }}
                className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md font-mono"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bug className="h-3 w-3" />
                  <span className="font-semibold">Debug Info</span>
                </div>
                <div>Error Digest: {error.digest}</div>
                <div>Timestamp: {new Date().toLocaleString()}</div>
              </motion.div>
            )}

            {/* Help Section */}
            <motion.div
              variants={SLIDE_UP}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.7 }}
              className="bg-muted/30 rounded-lg p-4 space-y-3"
            >
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Need Help?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a
                  href="/contactus"
                  className="flex items-center gap-2 text-primary hover:underline p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  Contact Support
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
                <a
                  href="https://docs.courseai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  Documentation
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t pt-8 pb-6">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
              variants={getStaggeredContainerAnimation(0.1)}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={getStaggeredAnimation()}>
                <Button
                  onClick={handleReset}
                  disabled={recoveryState === 'retrying'}
                  className="w-full h-11 text-base font-medium"
                  size="lg"
                >
                  <RefreshCw className={cn(
                    "mr-2 h-4 w-4",
                    recoveryState === 'retrying' && "animate-spin"
                  )} />
                  {recoveryState === 'retrying' ? 'Retrying...' : 'Try Again'}
                </Button>
              </motion.div>

              <motion.div variants={getStaggeredAnimation()}>
                <Button
                  variant="outline"
                  onClick={handleGoHome}
                  className="w-full h-11 text-base font-medium"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </motion.div>

              <motion.div variants={getStaggeredAnimation()}>
                <Button
                  variant="secondary"
                  onClick={handleGoBack}
                  className="w-full h-11 text-base font-medium"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </motion.div>
            </motion.div>

            {/* Status Footer */}
            <motion.div
              variants={SLIDE_UP}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t"
            >
              <Clock className="h-3 w-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
