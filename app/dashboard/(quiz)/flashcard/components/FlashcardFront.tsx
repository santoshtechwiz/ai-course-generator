"use client"

import { motion } from "framer-motion"
import { Eye, Lightbulb, Code2, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
  const cardVariants = {
    initial: { rotateY: 0 },
    animate: { rotateY: 0 },
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="w-full h-full"
      variants={animationsEnabled ? cardVariants : {}}
      initial="initial"
      animate="animate"
      style={{ transformStyle: "preserve-3d" }}
    >
      <Card className="w-full h-full min-h-[350px] bg-gradient-to-br from-primary/5 via-background to-primary/10 border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6 sm:p-8 h-full flex flex-col">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-6"
            variants={animationsEnabled ? contentVariants : {}}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Question</span>
              {type === "code" && (
                <Badge variant="outline" className="ml-2">
                  <Code2 className="w-3 h-3 mr-1" />
                  Code
                </Badge>
              )}
            </div>

            {keywords.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onToggleHint} className="text-xs hover:bg-primary/10">
                <Lightbulb className={cn("w-4 h-4 mr-1", showHint && "text-amber-500")} />
                Hint
              </Button>
            )}
          </motion.div>

          {/* Question Content */}
          <motion.div
            className="flex-1 flex flex-col justify-center space-y-6"
            variants={animationsEnabled ? contentVariants : {}}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            {/* Question Text */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed mb-4">
                {question}
              </h2>
            </div>

            {/* Code Snippet for Code Questions */}
            {type === "code" && codeSnippet && (
              <motion.div
                className="max-w-full mx-auto rounded-xl overflow-hidden shadow-lg border border-border/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* Code Header */}
                <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    {/* Terminal Dots */}
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>

                    {/* Language Badge */}
                    <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                      <Terminal className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-slate-300 text-xs font-mono font-medium">{language}</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <Code2 className="w-3 h-3 mr-1" />
                    {language.toUpperCase()}
                  </Badge>
                </div>

                {/* Code Content */}
                <div className="relative overflow-hidden max-h-64 overflow-y-auto">
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      borderRadius: "0",
                      fontSize: "0.875rem",
                      padding: "1.5rem",
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      lineHeight: "1.6",
                    }}
                    lineNumberStyle={{
                      color: "#64748b",
                      paddingRight: "1rem",
                      userSelect: "none",
                      fontSize: "0.75rem",
                    }}
                  >
                    {codeSnippet}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            )}

            {/* Hint Section */}
            {showHint && keywords.length > 0 && (
              <motion.div
                className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">Keywords:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            className="flex justify-center mt-6"
            variants={animationsEnabled ? contentVariants : {}}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onFlip}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Eye className="w-5 h-5 mr-2" />
              Show Answer
            </Button>
          </motion.div>

          {/* Swipe Indicator */}
          <motion.div
            className="text-center mt-4"
            variants={animationsEnabled ? contentVariants : {}}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-muted-foreground">Swipe left to flip • Swipe right for next card</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
