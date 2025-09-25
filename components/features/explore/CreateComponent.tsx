"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreateTileGrid } from "./CreateTitleGrid";
import { WavyBackground } from "./WavyBackground";
import { FloatingShapes } from "./FloatingShapes";

class ExploreErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Explore component error:', error, info)
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <p className="text-sm text-destructive font-medium mb-2">Failed to load explore tools.</p>
          <p className="text-xs text-muted-foreground mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors"
          >Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}

export function CreateComponent() {
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReduceMotion(mq.matches)
      const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
      mq.addEventListener?.('change', handler)
      return () => mq.removeEventListener?.('change', handler)
    } catch {}
  }, [])

  return (
    <ExploreErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
        {/* Enhanced Background Effects */}
        {!reduceMotion && (
          <>
            <WavyBackground />
            <FloatingShapes />

            {/* Animated gradient orbs */}
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
                scale: [1, 0.8, 1]
              }}
              transition={{ duration: 25, repeat: Infinity, delay: 5 }}
              className="absolute bottom-32 right-32 w-80 h-80 bg-gradient-to-r from-green-400/8 to-blue-400/8 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 120, 0],
                y: [0, -40, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 30, repeat: Infinity, delay: 10 }}
              className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-400/6 to-pink-400/6 rounded-full blur-3xl"
            />
          </>
        )}

        {/* Main Content */}
        <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <CreateTileGrid />
          </div>
        </main>
      </div>
    </ExploreErrorBoundary>
  )
}
