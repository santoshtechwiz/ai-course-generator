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
      <div className="w-full bg-card border-4 border-border rounded-lg shadow-neo p-4 sm:p-6 hover:shadow-neo-lg transition-all duration-200">
        {/* Header with Icon Badge */}
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-accent text-white border-3 sm:border-4 border-border shadow-neo-sm">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            {/* Type Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent text-white border-3 sm:border-4 border-border shadow-neo-sm font-black rounded-md">
              <span className="text-xs sm:text-sm tracking-wide">FLASHCARD</span>
            </div>
            
            {type === 'code' && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-success text-white border-3 sm:border-4 border-border shadow-neo-sm font-black rounded-md">
                <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs">Code</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Display */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center px-2 sm:px-4">
            <motion.h2
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {question}
            </motion.h2>
          </div>

          {type === 'code' && codeSnippet && (
            <div className="border-3 border-border shadow-neo overflow-hidden rounded-md">
              <div className="bg-foreground px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b-3 sm:border-b-4 border-border">
                <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-success text-white border-2 border-border shadow-neo-sm font-bold rounded-sm">
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

        {/* Footer with Flip Button */}
        <div className="mt-8 sm:mt-10 pt-4 sm:pt-6 border-t-4 border-border flex flex-col items-center space-y-3 sm:space-y-4">
          <button
            onClick={onFlip}
            className="bg-accent text-white border-3 sm:border-4 border-border shadow-neo w-full sm:w-auto sm:min-w-[240px] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none transition-all duration-200 rounded-md flex items-center justify-center gap-2"
            aria-label="Show answer"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Show Answer</span>
          </button>
          
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 select-none">
            <Sparkles className="w-3 h-3" />
            Tap or press <kbd className="px-2 py-1 text-xs font-bold bg-card border-2 border-border shadow-neo-sm rounded-sm">Space</kbd> to flip
          </p>
        </div>
      </div>
    </motion.div>
  )
}