"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { LoadingSpinner, InlineSpinner } from "./GlobalLoader"

export function LoaderDemo() {
  const { startLoading, setSuccess, setError, setProgress } = useGlobalLoader()
  const [localProgress, setLocalProgress] = useState(0)

  const handleDeterministicLoading = () => {
    startLoading({
      message: "Processing your request...",
      subMessage: "This will take a few seconds",
      isBlocking: true,
      autoProgress: true,
      deterministic: true,
      minVisibleMs: 2000,
    })

    // Simulate progress updates
    const interval = setInterval(() => {
      setLocalProgress(prev => {
        const next = prev + 10
        if (next <= 100) {
          setProgress(next)
          return next
        } else {
          clearInterval(interval)
          return prev
        }
      })
    }, 200)

    // Complete after 3 seconds
    setTimeout(() => {
      setSuccess("Operation completed successfully!")
      setLocalProgress(0)
    }, 3000)
  }

  const handleErrorLoading = () => {
    startLoading({
      message: "Attempting operation...",
      subMessage: "This might fail",
      isBlocking: true,
      autoProgress: true,
      deterministic: true,
      minVisibleMs: 1000,
    })

    setTimeout(() => {
      setError("Something went wrong. Please try again.")
    }, 2000)
  }

  const handleNonBlockingLoading = () => {
    startLoading({
      message: "Background task running...",
      subMessage: "You can continue using the app",
      isBlocking: false,
      autoProgress: true,
      deterministic: true,
      minVisibleMs: 3000,
    })

    setTimeout(() => {
      setSuccess("Background task completed!")
    }, 4000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Modern Loader System Demo</h1>
        <p className="text-muted-foreground">
          Experience the new deterministic, accessible, and modern loading system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Inline Spinner Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InlineSpinner size={20} />
              Inline Spinner
            </CardTitle>
            <CardDescription>
              Small spinner for inline use cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <InlineSpinner size={16} />
              <span className="text-sm">Loading...</span>
            </div>
            <div className="flex items-center gap-2">
              <InlineSpinner size={24} />
              <span className="text-sm">Processing...</span>
            </div>
          </CardContent>
        </Card>

        {/* Loading Spinner Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Spinner</CardTitle>
            <CardDescription>
              Main loading spinner for larger contexts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoadingSpinner size={48} />
          </CardContent>
        </Card>

        {/* Global Loader Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Global Loader</CardTitle>
            <CardDescription>
              Full-screen blocking loader with progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleDeterministicLoading} className="w-full">
              Start Deterministic Loading
            </Button>
            <Button onClick={handleErrorLoading} variant="outline" className="w-full">
              Simulate Error
            </Button>
            <Button onClick={handleNonBlockingLoading} variant="secondary" className="w-full">
              Non-blocking Loading
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>New Features</CardTitle>
          <CardDescription>
            What makes this loader system modern and deterministic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">🎯 Deterministic Progress</h4>
              <p className="text-sm text-muted-foreground">
                Smooth, predictable progress animation instead of random jumps
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">♿ Accessibility</h4>
              <p className="text-sm text-muted-foreground">
                Proper ARIA labels, screen reader support, and keyboard navigation
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">🎨 Modern Design</h4>
              <p className="text-sm text-muted-foreground">
                Clean SVG icons, smooth animations, and consistent theming
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">⚡ Performance</h4>
              <p className="text-sm text-muted-foreground">
                Optimized animations, proper cleanup, and minimal re-renders
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">🔄 State Management</h4>
              <p className="text-sm text-muted-foreground">
                Centralized Zustand store with proper timeout handling
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">📱 Responsive</h4>
              <p className="text-sm text-muted-foreground">
                Works seamlessly across all device sizes and orientations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}