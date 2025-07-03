"use client"

import { motion } from "framer-motion"
import { RotateCcw, Settings, Flame, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface FlashcardControllerProps {
  title: string
  currentIndex: number
  totalCards: number
  streak: number
  isReviewMode: boolean
  flipped: boolean
  autoAdvance: boolean
  showSettings: boolean
  onToggleFlip: () => void
  onNextCard: () => void
  onSetAutoAdvance: (value: boolean) => void
  onSetShowSettings: (value: boolean) => void
  onRestartQuiz: () => void
  onFinishQuiz: () => void
}

export function FlashcardController({
  title,
  currentIndex,
  totalCards,
  streak,
  isReviewMode,
  flipped,
  autoAdvance,
  showSettings,
  onToggleFlip,
  onNextCard,
  onSetAutoAdvance,
  onSetShowSettings,
  onRestartQuiz,
  onFinishQuiz,
}: FlashcardControllerProps) {
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0
  const isLastCard = currentIndex >= totalCards - 1

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Progress indicator */}
      <div className="w-full mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Card {currentIndex + 1} of {totalCards}</span>
          <motion.span
            key={`progress-${Math.round(progress)}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(progress)}% Complete
          </motion.span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className={cn(
              "h-full", 
              isReviewMode ? "bg-gradient-to-r from-yellow-400 to-yellow-500" : "bg-gradient-to-r from-green-400 to-green-500"
            )}
            style={{ width: `${progress}%` }}
            initial={{ width: `${(Math.max(0, currentIndex - 1) / totalCards) * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    
      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Advance</label>
                  <p className="text-xs text-muted-foreground">Automatically move to next card after rating</p>
                </div>
                <Switch checked={autoAdvance} onCheckedChange={onSetAutoAdvance} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onRestartQuiz} className="flex-1 bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

         {/* Navigation and Finish Buttons */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <Button 
          variant="outline" 
          onClick={onRestartQuiz}
          size="sm"
          className="text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Restart
        </Button>
        
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            onClick={onFinishQuiz}
            size="sm"
            className={cn("text-xs flex items-center gap-1", 
              currentIndex < Math.floor(totalCards * 0.5) && !isReviewMode ? "bg-amber-500 hover:bg-amber-600" : ""
            )}
          >
            Finish Quiz
          </Button>
          
          {!isLastCard && (
            <Button
              variant="default"
              onClick={onNextCard}
              size="sm"
              className="text-xs flex items-center gap-1 ml-2"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Keyboard Shortcuts */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Space: Flip • Arrow Keys: Navigate • 1-3: Rate (when flipped) • H: Hint
        </p>
      </div>
    </motion.div>
  )
}
