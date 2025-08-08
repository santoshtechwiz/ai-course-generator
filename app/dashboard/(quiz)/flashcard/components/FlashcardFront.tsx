"use client"

import { motion } from "framer-motion"
import { Eye, Lightbulb, Code2, Terminal, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface FlashcardFrontProps {
  question: string
  keywords?: string[]
  showHint: boolean
  onToggleHint: () => void
  onFlip: () => void
  animationsEnabled: boolean
  codeSnippet?: string
  language?: string
  type?: "mcq" | "code" | "text"
}

export function FlashcardFront({
  question,
  keywords = [],
  showHint,
  onToggleHint,
  onFlip,
  animationsEnabled,
  codeSnippet,
  language = "javascript",
  type = "text",
}: FlashcardFrontProps) {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card
        className="w-full max-w-4xl bg-card border shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <CardContent className="p-6 sm:p-8 lg:p-10">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm font-medium text-muted-foreground tracking-wide">
                  FLASHCARD
                </span>
                {type === 'code' && (
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <Code2 className="w-3 h-3" />
                    <span className="text-xs">Code</span>
                  </Badge>
                )}
              </div>
              {keywords.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleHint}
                  className={cn(
                    'text-sm h-9 px-3',
                    showHint && 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400',
                    'hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors duration-200'
                  )}
                  aria-label="Show hint keywords"
                >
                  <Lightbulb className={cn('w-4 h-4 mr-2', showHint && 'text-orange-500')} />
                  Hint
                </Button>
              )}
            </div>
          </CardHeader>

          <div className="space-y-6 sm:space-y-8">
            <div className="text-center space-y-4">
              <motion.h2
                className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-relaxed max-w-5xl mx-auto break-words"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {question}
              </motion.h2>
              
              {/* Visual separator like in QuizQuestion */}
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent rounded-full mx-auto max-w-32"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
            </div>

            {type === 'code' && codeSnippet && (
              <motion.div
                className="rounded-lg overflow-hidden border border-muted bg-muted/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs text-gray-300 font-mono">
                      {language}
                    </div>
                  </div>
                  <Terminal className="w-4 h-4 text-gray-400" />
                </div>
                <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      fontSize: '0.875rem',
                      padding: '1.5rem',
                      background: '#0f172a',
                      borderRadius: 0,
                    }}
                    lineNumberStyle={{
                      color: '#64748b',
                      paddingRight: '1rem',
                      minWidth: '2.5em',
                    }}
                  >
                    {codeSnippet}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            )}

            {showHint && keywords.length > 0 && (
              <motion.div
                className="bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 sm:p-5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Keywords
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs font-normal py-1.5 px-3 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-muted flex flex-col items-center space-y-4">
            <Button
              onClick={onFlip}
              size="lg"
              className="w-full sm:w-auto min-w-[200px] px-8 py-4 font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              aria-label="Show answer"
            >
              <Eye className="w-5 h-5 mr-2" />
              Show Answer
            </Button>
            
            <p className="text-xs text-muted-foreground flex items-center gap-2 select-none">
              <Sparkles className="w-3 h-3" />
              Tap or press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">Space</kbd> to flip
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}