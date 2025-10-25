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
  const styles = getColorClasses() // Get Neobrutalism styles
  
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, rotateY: 0 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: -90 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
  <div className="w-full bg-card border-4 border-border rounded-lg shadow-neo p-1 sm:p-1.5 hover:shadow-neo-lg transition-all duration-200">
        {/* Header with Icon Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-accent)] text-[var(--color-bg)] border-2 sm:border-3 border-border shadow-neo-sm">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            {/* Type Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-accent)] text-[var(--color-bg)] border-3 sm:border-4 border-border shadow-neo-sm font-black rounded-md hidden">
              <span className="text-xs sm:text-sm tracking-wide">FLASHCARD</span>
            </div>
            
            {type === 'code' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[var(--color-success)] text-[var(--color-bg)] border-3 sm:border-4 border-border shadow-neo-sm font-black rounded-md">
                <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs">Code</span>
              </div>
            )}
          </div>
        </div>

  {/* Question Display */}
  <div className="space-y-1 sm:space-y-2">
          <div className="text-center">
            <motion.h2
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-[var(--color-text)] leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {question}
            </motion.h2>
          </div>

          {type === 'code' && codeSnippet && (
            <div className="border-3 border-border shadow-neo overflow-hidden rounded-md">
              <div className="bg-[var(--color-card)] px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b-3 sm:border-b-4 border-border">
                <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-[var(--color-success)] text-[var(--color-bg)] border-2 border-border shadow-neo-sm font-bold rounded-sm">
                  <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-xs font-bold">{language}</span>
                </div>
              </div>
              
              {/* Code Content */}
              <div className="max-h-60 sm:max-h-72 overflow-y-auto bg-[var(--color-code-bg,#282c34)]">
                <SyntaxHighlighter
                  language={language}
                  style={atomOneDark}
                  showLineNumbers={false}
                  customStyle={{
                    margin: 0,
                    fontSize: '0.75rem',
                    padding: '1rem',
                    background: 'var(--color-code-bg, #282c34)',
                    borderRadius: 0,
                    lineHeight: '1.6',
                  }}
                  className="text-xs sm:text-sm"
                >
                  {codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>

        {/* Footer (hint only — flip is handled in the action bar) */}
        <div className="mt-2 sm:mt-2 pt-1 sm:pt-1 border-t-2 border-border flex flex-col items-center space-y-1">
          <p className="text-xs font-medium text-[var(--color-text)]/70 flex items-center gap-2 select-none">
            <Sparkles className="w-3 h-3" />
            Tap or press <kbd className="px-1.5 py-0.5 text-xs font-bold bg-[var(--color-bg)] border-2 border-border shadow-neo-sm rounded-sm">Space</kbd> to flip
          </p>
        </div>
      </div>
    </motion.div>
  )
}