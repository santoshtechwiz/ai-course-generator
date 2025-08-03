"use client"

import { motion } from "framer-motion"
import { Eye, Lightbulb, Code2, Terminal, Sparkles } from "lucide-react"
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
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full h-full min-h-[400px] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/30 border-2 border-blue-200/50 dark:border-blue-800/30 shadow-xl hover:shadow-2xl transition-all duration-500 group">
        <CardContent className="p-8 h-full flex flex-col relative overflow-hidden">
          {/* Floating background elements */}
          <motion.div
            className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">QUESTION</span>
              {type === "code" && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                >
                  <Code2 className="w-3 h-3 mr-1" />
                  Code
                </Badge>
              )}
            </div>

            {keywords.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleHint}
                  className={cn(
                    "text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-300",
                    showHint && "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
                  )}
                >
                  <Lightbulb className={cn("w-4 h-4 mr-1", showHint && "text-amber-500")} />
                  Hint
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Question Content */}
          <motion.div
            className="flex-1 flex flex-col justify-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Question Text */}
            <div className="text-center px-4">
              <motion.h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {question}
              </motion.h2>
            </div>

            {/* Code Snippet */}
            {type === "code" && codeSnippet && (
              <motion.div
                className="max-w-full mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-lg">
                      <Terminal className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-300 text-sm font-mono">{language}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    <Code2 className="w-3 h-3 mr-1" />
                    {language.toUpperCase()}
                  </Badge>
                </div>
                <div className="relative max-h-64 overflow-y-auto">
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
                className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 mx-4"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </motion.div>
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Keywords to help you:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Badge
                        variant="outline"
                        className="text-sm bg-white dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors duration-200"
                      >
                        {keyword}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Show Answer Button */}
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              <Button
                onClick={onFlip}
                size="lg"
                className="relative bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 border-0"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Eye className="w-5 h-5 mr-3" />
                </motion.div>
                Show Answer
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
                  animate={{ scale: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Interaction Hint */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Tap card or press Space to flip
              <Sparkles className="w-3 h-3" />
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
