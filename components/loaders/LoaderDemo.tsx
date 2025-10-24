"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePageLoader, useQuizLoader, useComponentLoader } from "./LoadingStateProvider"
import { ComponentLoader, InlineLoader } from "./CentralizedLoader"

export function LoaderDemo() {
  const pageLoader = usePageLoader()
  const quizLoader = useQuizLoader()
  const componentLoader = useComponentLoader()
  const [inlineLoading, setInlineLoading] = useState(false)

  const simulatePageLoad = () => {
    pageLoader.show("Loading page...")
    setTimeout(() => pageLoader.hide(), 3000)
  }

  const simulateQuizLoad = () => {
    quizLoader.show("Loading quiz...")
    setTimeout(() => quizLoader.hide(), 2500)
  }

  const simulateComponentLoad = () => {
    componentLoader.show("Loading component...")
    setTimeout(() => componentLoader.hide(), 2000)
  }

  const simulateInlineLoad = () => {
    setInlineLoading(true)
    setTimeout(() => setInlineLoading(false), 1500)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🎯 Centralized Loader Demo</CardTitle>
        <p className="text-muted-foreground">
          Test the priority-based loading system. Only the highest priority loader will show.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={simulatePageLoad} variant="outline">
            Page Loader (Priority 4)
          </Button>
          <Button onClick={simulateQuizLoad} variant="outline">
            Quiz Loader (Priority 3)
          </Button>
          <Button onClick={simulateComponentLoad} variant="outline">
            Component Loader (Priority 2)
          </Button>
          <Button onClick={simulateInlineLoad} variant="outline" disabled={inlineLoading}>
            {inlineLoading ? (
              <InlineLoader message="Loading..." size="sm" />
            ) : (
              "Inline Loader (Priority 1)"
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Priority System:</h4>
          <ul className="text-sm space-y-1">
            <li>🟡 <strong>Page:</strong> Yellow theme, skeleton variant, full screen</li>
            <li>🔵 <strong>Quiz:</strong> Blue theme, spinner variant, full screen</li>
            <li>🟢 <strong>Component:</strong> Green theme, spinner variant, inline</li>
            <li>🟣 <strong>Inline:</strong> Purple theme, dots variant, button-level</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Test Scenarios:</h4>
          <div className="text-sm space-y-1">
            <p>• Click multiple loaders quickly → Only highest priority shows</p>
            <p>• Page loader overrides all others</p>
            <p>• Quiz loader overrides component loader</p>
            <p>• Smooth transitions with Neobrutalism styling</p>
          </div>
        </div>

        <div className="mt-4 p-3 border rounded">
          <ComponentLoader 
            message="Example component loader" 
            variant="skeleton" 
            size="md"
            className="max-w-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}