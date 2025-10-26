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
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        {/* Enhanced Background Effects with Current Theme */}
        {!reduceMotion && (
          <>
            <WavyBackground />
            <FloatingShapes />
          </>
        )}

        {/* Main Content */}
        <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12  ">
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <CreateTileGrid />
          </div>
        </main>
      </div>
    </ExploreErrorBoundary>
  )
}
