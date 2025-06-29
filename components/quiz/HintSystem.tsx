// Assuming HintLevel, HintSystemConfig, and other utility functions are defined as before.
// This focuses on the HintSystem component and how it interacts with the analyzeUserInput function.

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Eye, AlertTriangle, CheckCircle, Info } from "lucide-react" // Added Info icon
import { motion, AnimatePresence } from "framer-motion" // For animations

import { cn } from "@/lib/utils"
import { HintLevel, analyzeUserInput } from "@/lib/utils/hint-system" // Ensure analyzeUserInput is imported

interface HintSystemProps {
  hints: HintLevel[]
  onHintUsed?: (hintIndex: number, hint: HintLevel) => void
  className?: string
  // New props for proactive hints
  userInput?: string // Current text input from the user
  correctAnswer?: string // The correct answer for analysis
  questionText?: string // The question text for analysis
}

export function HintSystem({
  hints,
  onHintUsed,
  className,
  userInput,
  correctAnswer,
  questionText,
}: HintSystemProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [proactiveHint, setProactiveHint] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [hintToConfirm, setHintToConfirm] = useState<HintLevel | null>(null)
  const [hintIndexToConfirm, setHintIndexToConfirm] = useState<number | null>(null)

  // Effect to analyze user input and provide proactive hints
  useEffect(() => {
    if (userInput && correctAnswer && questionText) {
      const feedback = analyzeUserInput(userInput, correctAnswer, questionText)
      setProactiveHint(feedback)
    } else {
      setProactiveHint(null)
    }
  }, [userInput, correctAnswer, questionText])

  if (!hints || hints.length === 0) return null

  const nextHint = hints[revealedCount]

  const handleReveal = () => {
    if (!nextHint) return;

    // If the next hint is a high spoiler, show confirmation
    if (nextHint.spoilerLevel === "high") {
      setHintToConfirm(nextHint);
      setHintIndexToConfirm(revealedCount);
      setShowConfirmation(true);
    } else {
      // Otherwise, reveal directly
      revealConfirmedHint();
    }
  }

  const revealConfirmedHint = () => {
    const next = revealedCount
    if (next < hints.length) {
      const hint = hints[next];
      onHintUsed?.(next, hint);
      setRevealedCount(next + 1);
      setShowConfirmation(false); // Close confirmation if open
      setHintToConfirm(null);
      setHintIndexToConfirm(null);
    }
  }

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setHintToConfirm(null);
    setHintIndexToConfirm(null);
  }

  const getColor = (spoiler: HintLevel["spoilerLevel"]) => {
    switch (spoiler) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
      default:
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const totalPenalty = hints.slice(0, revealedCount).reduce((acc, h) => acc + (h.penalty || 0), 0);

  return (
    <Card className={cn("bg-blue-50/40 border-blue-100 relative overflow-hidden", className)}>
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Hints & Guidance
        </CardTitle>
        <Badge variant="outline" className="text-sm">
          {revealedCount}/{hints.length} Hints Used
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proactive Hint Section */}
        <AnimatePresence>
          {proactiveHint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-blue-100 border border-blue-300 text-blue-800 p-3 rounded-md flex items-start gap-2 text-sm"
            >
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Proactive Tip:</span> {proactiveHint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed Hints */}
        <AnimatePresence>
          {hints.slice(0, revealedCount).map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border rounded-lg p-4 bg-white shadow-sm transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">Hint {index + 1}</span>
                <Badge className={cn("text-xs", getColor(hint.spoilerLevel))}>
                  {hint.spoilerLevel.toUpperCase()} Spoiler
                </Badge>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">{hint.content}</p>

              <div className="text-xs text-gray-500 italic flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                {hint.description} – Penalty: <span className="font-bold text-red-600">-{hint.penalty}%</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Reveal Next Hint Button */}
        {revealedCount < hints.length ? (
          <Button
            onClick={handleReveal}
            className="w-full text-sm mt-4 transition-all duration-300 ease-in-out"
            variant={nextHint?.spoilerLevel === "high" ? "destructive" : "secondary"}
          >
            <Eye className="w-4 h-4 mr-2" />
            {nextHint?.spoilerLevel === "high" ? "Reveal High Spoiler Hint" : `Reveal Hint ${revealedCount + 1}`}
          </Button>
        ) : (
          <div className="text-center text-gray-500 text-sm py-2 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            All hints revealed.
          </div>
        )}

        {/* Total Penalty Display */}
        {revealedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-2 border-t pt-4 mt-4 text-yellow-800 text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Total Score Penalty: <span className="font-bold text-red-700">-{totalPenalty}%</span>
            <span className="text-gray-500 text-xs ml-1">(This will be deducted from your final score)</span>
          </motion.div>
        )}
      </CardContent>

      {/* Confirmation Modal for High Spoiler Hints */}
      <AnimatePresence>
        {showConfirmation && hintToConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center"
            >
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2 text-gray-900">Confirm Hint Reveal</h3>
              <p className="text-sm text-gray-600 mb-4">
                This is a <span className="font-bold text-red-600">HIGH SPOILER</span> hint. Revealing it will significantly impact your score.
                <br />
                Penalty: <span className="font-bold text-red-700">-{hintToConfirm.penalty}%</span>
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={cancelConfirmation}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={revealConfirmedHint}>
                  Reveal Anyway
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

