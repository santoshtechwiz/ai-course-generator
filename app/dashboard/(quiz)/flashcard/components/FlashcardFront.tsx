"use client"

import { motion } from "framer-motion"
import { Eye, Lightbulb, Code2, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, getColorClasses } from "@/lib/utils"
import SyntaxHighlighter from "react-syntax-highlighter"
import atomOneDark from "react-syntax-highlighter/dist/styles/atom-one-dark"


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
  const styles = getColorClasses('flashcard') // Cyan accent (#06B6D4)
  
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div className={`${styles.cardPrimary} w-full max-w-4xl p-8 lg:p-12`}>
        {/* Header with Icon Badge */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
              <BookOpen className="w-6 h-6" />
            </div>
            
            {/* Type Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary border-3 border-primary/30 shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.3)]">
              <span className="text-sm font-black tracking-wide">FLASHCARD</span>
            </div>
            
            {type === 'code' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-3 border-emerald-600 dark:border-emerald-400 shadow-[2px_2px_0px_0px_hsl(var(--border))]">
                <Code2 className="w-4 h-4" />
                <span className="text-xs font-black">Code</span>
              </div>
            )}
          </div>
          
          {keywords.length > 0 && (
            <button
              onClick={onToggleHint}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 border-3 border-border font-black text-sm transition-all duration-150 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-[2px] hover:translate-y-[2px]',
                showHint 
                  ? 'bg-primary/20 dark:bg-primary/30 text-primary border-primary/50 shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.3)] transform translate-x-[3px] translate-y-[3px]'
                  : 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 hover:border-primary/50'
              )}
              aria-label="Show hint keywords"
            >
              <Lightbulb className="w-4 h-4" />
              Hint
            </button>
          )}
        </div>

        {/* Question Display */}
        <div className="space-y-6">
          <div className="text-center">
            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {question}
            </motion.h2>
          </div>

          {type === 'code' && codeSnippet && (
            <div className="border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
              {/* Code Editor Header */}
              <div className="bg-gray-900 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-b-3 border-border">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600 dark:bg-emerald-500 text-white border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]">
                  <Code2 className="w-3.5 h-3.5" />
                  <Code2 className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white">{language}</span>
                </div>
              </div>
              
              {/* Code Content */}
              <div className="max-h-72 overflow-y-auto bg-[#282c34]">
                <SyntaxHighlighter
                  language={language}
                  style={atomOneDark}
                  showLineNumbers={false}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.875rem',
                    padding: '1.5rem',
                    background: '#282c34',
                    borderRadius: 0,
                    lineHeight: '1.6',
                  }}
                >
                  {codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {showHint && keywords.length > 0 && (
            <motion.div
              className="bg-yellow-100 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-300 border-2 border-black flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-bold text-black">Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-white border-2 border-black text-xs font-bold text-black"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer with Flip Button */}
        <div className="mt-10 pt-6 border-t-3 border-black flex flex-col items-center space-y-4">
          <button
            onClick={onFlip}
            className={`${styles.buttonPrimary} w-full sm:w-auto min-w-[240px] px-8 py-4 text-base`}
            aria-label="Show answer"
          >
            <Eye className="w-5 h-5 mr-2" />
            Show Answer
          </button>
          
          <p className="text-xs font-medium text-black/60 flex items-center gap-2 select-none">
            <Sparkles className="w-3 h-3" />
            Tap or press <kbd className="px-2 py-1 text-xs font-bold bg-white border-2 border-black">Space</kbd> to flip
          </p>
        </div>
      </div>
    </motion.div>
  )
}