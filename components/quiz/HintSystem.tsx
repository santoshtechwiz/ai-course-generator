"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HintLevel } from "@/lib/utils/hint-system"
import { getNextHint } from "@/lib/utils/hint-system"

interface HintSystemProps {
  hints: HintLevel[]
  onHintUsed: (hintLevel: number) => void
  maxHints?: number
  allowDirectAnswer?: boolean
  className?: string
}

export function HintSystem({ hints, onHintUsed, maxHints = 3, allowDirectAnswer = false, className }: HintSystemProps) {
  const [currentHintLevel, setCurrentHintLevel] = useState(0)
  const [revealedHints, setRevealedHints] = useState<HintLevel[]>([])

  const handleGetHint = useCallback(() => {
    const nextHint = getNextHint(hints, currentHintLevel, {
      maxHints,
      progressiveReveal: true,
      allowDirectAnswer,
    })

    if (nextHint) {
      setCurrentHintLevel(nextHint.level)
      setRevealedHints((prev) => [...prev, nextHint])
      onHintUsed(nextHint.level)
    }
  }, [hints, currentHintLevel, maxHints, allowDirectAnswer, onHintUsed])

  const canGetMoreHints = currentHintLevel < maxHints && currentHintLevel < hints.length

  const getSpoilerColor = (level: string) => {
    switch (level) {
      case "low":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
      case "medium":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
      case "high":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
    }
  }

  const getSpoilerIcon = (level: string) => {
    switch (level) {
      case "low":
        return Eye
      case "medium":
        return EyeOff
      case "high":
        return AlertTriangle
      default:
        return Lightbulb
    }
  }

  if (!hints || hints.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hint Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-foreground">Need help?</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetHint}
          disabled={!canGetMoreHints}
          className="text-xs bg-transparent"
        >
          {currentHintLevel === 0 ? "Get Hint" : `Get Hint ${currentHintLevel + 1}`}
          {currentHintLevel > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              -{currentHintLevel * 5}%
            </Badge>
          )}
        </Button>
      </div>

      {/* Revealed Hints */}
      <AnimatePresence>
        {revealedHints.map((hint, index) => {
          const SpoilerIcon = getSpoilerIcon(hint.spoilerLevel)
          return (
            <motion.div
              key={hint.level}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={cn("border-2", getSpoilerColor(hint.spoilerLevel))}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <SpoilerIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Hint {hint.level}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            hint.spoilerLevel === "low"
                              ? "bg-blue-100 text-blue-800"
                              : hint.spoilerLevel === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800",
                          )}
                        >
                          {hint.spoilerLevel} spoiler
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{hint.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Hint Progress */}
      {currentHintLevel > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {currentHintLevel} of {Math.min(maxHints, hints.length)} hints used
          {currentHintLevel > 0 && ` • Score penalty: -${currentHintLevel * 5}%`}
        </div>
      )}
    </div>
  )
}
