"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface HintSystemProps {
  hints: string[]
  onHintUsed?: (hintIndex: number) => void
  className?: string
}

export function HintSystem({ hints, onHintUsed, className }: HintSystemProps) {
  const [revealedHints, setRevealedHints] = useState<number[]>([])

  if (!hints || hints.length === 0) return null

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index])
      onHintUsed?.(index)
    }
  }

  const getSpoilerLevel = (index: number) => {
    if (index === 0) return { level: "Low", color: "bg-green-100 text-green-800 border-green-200" }
    if (index === 1) return { level: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    return { level: "High", color: "bg-red-100 text-red-800 border-red-200" }
  }

  return (
    <Card className={cn("border-blue-200 bg-blue-50/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          Hints Available
          <Badge variant="outline" className="ml-auto">
            {revealedHints.length}/{hints.length} used
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hints.map((hint, index) => {
          const isRevealed = revealedHints.includes(index)
          const spoiler = getSpoilerLevel(index)

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Hint {index + 1}</span>
                  <Badge variant="outline" className={cn("text-xs", spoiler.color)}>
                    {spoiler.level} Spoiler
                  </Badge>
                </div>
                {!isRevealed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revealHint(index)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    Reveal
                  </Button>
                )}
              </div>

              {isRevealed ? (
                <div className="p-3 bg-white rounded-md border border-gray-200">
                  <p className="text-sm text-gray-700">{hint}</p>
                </div>
              ) : (
                <div className="p-3 bg-gray-100 rounded-md border border-gray-200 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Click reveal to see this hint</span>
                </div>
              )}
            </div>
          )
        })}

        {revealedHints.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">Score penalty: -{revealedHints.length * 5}% for using hints</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
