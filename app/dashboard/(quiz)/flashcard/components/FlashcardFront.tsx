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
      <div className="w-full bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-neo)] p-4 sm:p-6 hover:shadow-[6px_6px_0_#000] transition-all duration-200">
        {/* Header with Icon Badge */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-primary)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
              <BookOpen className="w-6 h-6" />
            </div>
            
            {/* Type Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] font-black">
              <span className="text-sm tracking-wide">FLASHCARD</span>
            </div>
            
            {type === 'code' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-success)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] font-black">
                <Code2 className="w-4 h-4" />
                <span className="text-xs">Code</span>
              </div>
            )}
          </div>
          
          {keywords.length > 0 && (
            <button
              onClick={onToggleHint}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 border-4 border-[var(--color-border)] font-black text-sm transition-all duration-150 shadow-[var(--shadow-neo)] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]',
                showHint 
                  ? 'bg-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-accent)] shadow-[3px_3px_0_#000] transform translate-x-[3px] translate-y-[3px]'
                  : 'bg-[var(--color-primary)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
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
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground leading-tight break-words"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.15 }}
            >
              {question}
            </motion.h2>
          </div>

          {type === 'code' && codeSnippet && (
            <div className="border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] overflow-hidden">
              <div className="bg-[var(--color-text)] px-4 py-3 flex items-center justify-between border-b-4 border-[var(--color-border)]">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success)] text-[var(--color-text)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_#000] font-bold">
                  <Code2 className="w-3.5 h-3.5" />
                  <Code2 className="w-3.5 h-3.5 text-[var(--color-text)]" />
                  <span className="text-xs font-bold text-[var(--color-text)]">{language}</span>
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

            <motion.div
              className="bg-[var(--color-warning)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] p-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[var(--color-warning)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_#000]">
                  <Lightbulb className="w-4 h-4 text-[var(--color-text)]" />
                </div>
                <span className="text-sm font-bold text-[var(--color-text)]">Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-[var(--color-card)] border-2 border-[var(--color-border)] text-xs font-bold text-[var(--color-text)] shadow-[2px_2px_0_#000]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </motion.div>
        </div>

        {/* Footer with Flip Button */}
        <div className="mt-10 pt-6 border-t-4 border-[var(--color-border)] flex flex-col items-center space-y-4">
          <button
            onClick={onFlip}
            className="bg-[var(--color-primary)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] w-full sm:w-auto min-w-[240px] px-8 py-4 text-base font-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none transition-all duration-200"
            aria-label="Show answer"
          >
            <Eye className="w-5 h-5 mr-2" />
            Show Answer
          </button>
          
          <p className="text-xs font-medium text-[var(--color-text)] flex items-center gap-2 select-none">
            <Sparkles className="w-3 h-3" />
            Tap or press <kbd className="px-2 py-1 text-xs font-bold bg-[var(--color-card)] border-2 border-[var(--color-border)] shadow-[1px_1px_0_#000]">Space</kbd> to flip
          </p>
        </div>
      </div>
    </motion.div>
  )
}