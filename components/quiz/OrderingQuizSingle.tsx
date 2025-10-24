"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import neo from '@/components/neo/tokens'
import { GripVertical, ChevronUp, ChevronDown, Check, Star, ArrowDownUp, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * OrderingQuizEnterprise.tsx
 *
 * Production-ready, enterprise-grade ordering quiz components.
 * - Visual indications (states, micro-interactions, progress)
 * - Accessibility and keyboard-first controls
 * - Persistence (localStorage) + server-save hooks (stubbed)
 * - Lightweight analytics hook to track events for monetization
 * - Clear extension points for premium features (timed mode, hints, pro analytics)
 *
 * Dependencies: framer-motion, lucide-react, Tailwind + your UI components
 */

/* ----------------------------- Types -------------------------------- */
interface OrderingQuizStep {
  id: number | string
  description: string
  explanation?: string
}

interface OrderingQuizQuestion {
  id?: string | number
  title: string
  topic?: string
  description?: string
  difficulty?: "easy" | "medium" | "hard"
  steps: OrderingQuizStep[]
  type?: "ordering"
}

/* ----------------------------- Hooks -------------------------------- */

// Lightweight analytics hook (replace sendEvent with your implementation)
function useAnalytics() {
  const sendEvent = useCallback((name: string, payload: any = {}) => {
    // TODO: wire to your analytics backend (Segment, Posthog, GA4, etc.)
    // Keep this tiny to save tokens and bandwidth in production.
    if (typeof window === "undefined") return
    try {
      // Example: window.analytics?.track?.(name, payload)
      console.debug("[analytics]", name, payload)
    } catch (e) {
      // swallow
    }
  }, [])

  return { sendEvent }
}

// Local persistence: saves by question id. Namespaced to avoid collisions.
function useLocalPersistence(questionId?: string | number) {
  const key = questionId ? `courseai:ordering:${questionId}` : null

  const load = useCallback(() => {
    if (!key) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as number[]
    } catch (e) {
      return null
    }
  }, [key])

  const save = useCallback(
    (value: number[]) => {
      if (!key) return
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        // ignore
      }
    },
    [key],
  )

  const clear = useCallback(() => {
    if (!key) return
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  }, [key])

  return { load, save, clear }
}

/* ----------------------------- Utils -------------------------------- */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  // Simple deterministic-ish shuffle when seed provided; otherwise random
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j =
      seed !== undefined
        ? Math.floor(((seed + i) * 9301 + 49297) % 233280) % (i + 1)
        : Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/* ------------------------- Visual Components ------------------------- */

function DifficultyBadge({ difficulty }: { difficulty?: OrderingQuizQuestion["difficulty"] }) {
  if (!difficulty) return null
  const colors = {
    easy: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    hard: "bg-red-100 text-red-800 border-red-300",
  }
  return (
    <Badge variant="neutral" className={cn(neo.badge, "px-3 py-1.5 text-xs font-semibold", colors[difficulty])}>
      {difficulty}
    </Badge>
  )
}

/* Minimal progress ring showing completion percentage */
function QuizProgress({ value, size = 56 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} fill="transparent" strokeWidth={6} strokeOpacity={0.08} stroke="currentColor" />
        <circle
          r={radius}
          fill="transparent"
          strokeWidth={6}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
        <text x="0" y="4" textAnchor="middle" fontSize={12} fontWeight={700}>
          {Math.round(value)}%
        </text>
      </g>
    </svg>
  )
}

/* ---------------------- Ordering Quiz Item --------------------------- */
function StepItem({
  step,
  index,
  isDragged,
  isDropTarget,
  label,
  showInitialHint,
}: {
  step: OrderingQuizStep
  index: number
  isDragged: boolean
  isDropTarget: boolean
  label: string
  showInitialHint?: boolean
}) {
  // Generate consistent color based on step ID for visual consistency
  const stepColor = useMemo(() => {
    const colors = [
      "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800",
      "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800",
      "bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800",
      "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800",
      "bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800",
      "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:border-cyan-800",
    ]
    const id = typeof step.id === "string" ? step.id.charCodeAt(0) : step.id
    return colors[id % colors.length]
  }, [step.id])

  const textColor = useMemo(() => {
    const colors = [
      "text-blue-800",
      "text-green-800",
      "text-purple-800",
      "text-amber-800",
      "text-rose-800",
      "text-cyan-800",
    ]
    const id = typeof step.id === "string" ? step.id.charCodeAt(0) : step.id
    return colors[id % colors.length]
  }, [step.id])

  return (
    <div className="relative">
      {isDropTarget && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full z-50"
        >
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            Drop Here
          </motion.div>
        </motion.div>
      )}

      {isDragged && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 z-0"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-blue-500 text-sm font-medium">Dragging...</div>
          </div>
        </motion.div>
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isDragged ? 0.4 : 1,
          y: 0,
          scale: isDropTarget ? 1.02 : 1,
        }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{
          layout: { duration: 0.2 },
          opacity: { duration: 0.15 },
        }}
        className={cn(
          "group flex items-start gap-3 p-4 rounded-xl border-2 transition-all",
          "cursor-grab active:cursor-grabbing",
          "hover:shadow-lg hover:border-primary/50",
          stepColor,
          isDragged && "opacity-40 scale-105",
          isDropTarget && "ring-2 ring-green-400 shadow-xl border-green-400 bg-green-50/80 dark:bg-green-900/40",
        )}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            className={cn(
              "relative p-3 rounded-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border-2 cursor-grab active:cursor-grabbing",
              isDragged
                ? "bg-blue-500 text-white border-blue-600 shadow-xl shadow-blue-500/50"
                : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary border-primary/30 group-hover:from-primary/30 group-hover:to-primary/20 group-hover:border-primary/50 group-hover:shadow-lg",
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={
              showInitialHint && !isDragged
                ? {
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 5, 0],
                  }
                : {}
            }
            transition={
              showInitialHint
                ? {
                    duration: 2,
                    repeat: 3,
                    repeatDelay: 1,
                  }
                : {}
            }
          >
            <GripVertical className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <motion.div
              className="absolute -right-1 -top-1"
              animate={
                showInitialHint
                  ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                    }
                  : {}
              }
              transition={
                showInitialHint
                  ? {
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }
                  : {}
              }
            >
              <Hand className="h-3 w-3 text-primary drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className={cn("font-semibold text-sm", textColor)}>{step.description}</div>
            <div
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 min-w-20 text-center shadow-sm",
                isDragged
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110"
                  : isDropTarget
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/50 scale-105"
                    : "bg-white/90 text-gray-700 border-2 border-gray-200 group-hover:border-primary/40 group-hover:bg-primary/5",
              )}
            >
              {isDropTarget ? "✓ Drop" : isDragged ? "Moving..." : label}
            </div>
          </div>
          {step.explanation && (
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.explanation}</div>
          )}

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/70">
            <ChevronUp className="h-3 w-3" />
            <ChevronDown className="h-3 w-3" />
            <span>Use arrow keys to reorder</span>
          </div>
        </div>

        {isDropTarget && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50"
          >
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

/* -------------------- OrderingQuizSingleEnhanced --------------------- */
function OrderingQuizSingleEnhanced({
  question,
  questionNumber = 1,
  totalQuestions = 1,
  onAnswer,
  existingAnswer,
  enablePersistence = true,
  className = "",
}: {
  question: OrderingQuizQuestion
  questionNumber?: number
  totalQuestions?: number
  onAnswer?: (orderedIds: (number | string)[]) => void
  existingAnswer?: number[]
  enablePersistence?: boolean
  className?: string
}) {
  const { sendEvent } = useAnalytics()
  const persistence = useLocalPersistence(question.id)

  // initial shuffle deterministic by question id to avoid different order each render
  const initial = useMemo(() => {
    const seed =
      typeof question.id === "number"
        ? question.id
        : String(question.id || question.title)
            .split("")
            .reduce((a, c) => a + c.charCodeAt(0), 0)
    return shuffleArray(question.steps, seed)
  }, [question.id, question.steps, question.title])

  const [items, setItems] = useState<OrderingQuizStep[]>(() => {
    if (existingAnswer && Array.isArray(existingAnswer) && existingAnswer.length === initial.length) {
      return existingAnswer.map((idx) => initial[idx]).filter(Boolean)
    }
    return initial
  })

  const [draggedItem, setDraggedItem] = useState<OrderingQuizStep | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    if (existingAnswer && Array.isArray(existingAnswer) && existingAnswer.length === initial.length) {
      setItems(existingAnswer.map((idx) => initial[idx]).filter(Boolean))
    } else {
      setItems(initial)
    }
  }, [question.id])

  useEffect(() => {
    if (!enablePersistence || existingAnswer) return
    if (items.length === 0) return

    const saved = persistence.load()
    if (saved && Array.isArray(saved) && saved.length === items.length) {
      setItems(saved.map((idx) => initial[idx]).filter(Boolean))
    }
  }, [question.id])

  useEffect(() => {
    const ids = items.map((item) => item.id)
    onAnswer?.(ids)
  }, [items, onAnswer])

  useEffect(() => {
    if (!enablePersistence) return
    const indices = items.map((item) => initial.findIndex((s) => s.id === item.id))
    const t = setTimeout(() => persistence.save(indices), 250)
    return () => clearTimeout(t)
  }, [items, enablePersistence, initial, persistence])

  const handleDragStart = useCallback(
    (item: OrderingQuizStep) => {
      setDraggedItem(item)
      setDropTargetIndex(null)
      setHasInteracted(true)
      setShowInstructions(false)
      sendEvent("ordering.drag_start", { questionId: question.id, itemId: item.id })
    },
    [question.id, sendEvent],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (!draggedItem) return

      setDropTargetIndex(index)
    },
    [draggedItem],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      if (!draggedItem) return

      const dragIndex = items.findIndex((item) => item.id === draggedItem.id)
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedItem(null)
        setDropTargetIndex(null)
        return
      }

      setItems((prev) => {
        const newItems = [...prev]
        const [removed] = newItems.splice(dragIndex, 1)
        newItems.splice(dropIndex, 0, removed)
        return newItems
      })

      sendEvent("ordering.reorder", {
        questionId: question.id,
        from: dragIndex,
        to: dropIndex,
      })

      setDraggedItem(null)
      setDropTargetIndex(null)
    },
    [draggedItem, items, question.id, sendEvent],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDropTargetIndex(null)
    sendEvent("ordering.drag_end", { questionId: question.id })
  }, [sendEvent, question.id])

  const handleKey = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      setHasInteracted(true)
      setShowInstructions(false)

      if (e.key === "ArrowUp" && index > 0) {
        setItems((prev) => {
          const newItems = [...prev]
          ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
          return newItems
        })
        sendEvent("ordering.keyboard_move", { questionId: question.id, from: index, to: index - 1 })
      } else if (e.key === "ArrowDown" && index < items.length - 1) {
        setItems((prev) => {
          const newItems = [...prev]
          ;[newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]]
          return newItems
        })
        sendEvent("ordering.keyboard_move", { questionId: question.id, from: index, to: index + 1 })
      }
    },
    [items.length, question.id, sendEvent],
  )

  const hasChanged = useMemo(() => {
    return items.some((item, i) => item.id !== initial[i]?.id)
  }, [items, initial])

  const isLikelyCorrect = useMemo(() => {
    const ids = items.map((s) => s.id)
    const originalIds = question.steps.map((s) => s.id)
    if (!originalIds || originalIds.length !== ids.length) return null
    return ids.every((id, i) => id === originalIds[i])
  }, [items, question.steps])

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card className="shadow-xl border-2">
        <CardHeader className="flex items-start justify-between gap-4 p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="neutral" className={cn(neo.badge, "bg-primary/10 text-primary border border-primary/20")}>
                  Question {questionNumber} / {totalQuestions}
                </Badge>
              <DifficultyBadge difficulty={question.difficulty} />

              {hasChanged && (
                <Badge className="ml-2 bg-indigo-100 text-indigo-800 border border-indigo-300">Modified</Badge>
              )}
            </div>

            <CardTitle className="mt-3 text-xl font-semibold text-balance">{question.title}</CardTitle>
            {question.description && (
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{question.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="w-16 h-16">
                <QuizProgress
                  value={(items.filter((item, i) => item.id === initial[i]?.id).length / items.length) * 100}
                />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-muted-foreground">Quick check</div>
              <div className="flex items-center gap-2">
                {isLikelyCorrect === true && (
                  <div className="inline-flex items-center gap-1 text-green-700 font-medium">
                    <Check className="h-4 w-4" /> Looks aligned
                  </div>
                )}
                {isLikelyCorrect === false && (
                  <div className="inline-flex items-center gap-1 text-orange-700 font-medium">
                    <Star className="h-4 w-4" /> Review
                  </div>
                )}
                {isLikelyCorrect === null && <div className="text-muted-foreground text-xs">—</div>}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-lg">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Dismiss instructions"
                  >
                    ✕
                  </button>
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        rotate: [0, -10, 10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1,
                      }}
                      className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Hand className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 text-lg mb-2">How to Reorder Steps</h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>
                            <strong>Drag & Drop:</strong> Click and hold the grip handle (
                            <GripVertical className="inline h-4 w-4" />) to drag items
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>
                            <strong>Keyboard:</strong> Use{" "}
                            <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                              ↑
                            </kbd>{" "}
                            <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                              ↓
                            </kbd>{" "}
                            arrow keys to move items
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>
                            <strong>Drop Zones:</strong> Green indicators show where you can drop items
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {draggedItem && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center justify-center gap-3 font-semibold">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <ArrowDownUp className="h-5 w-5" />
                </motion.div>
                <span>Dragging "{draggedItem.description}"... Drop on a green zone to place</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4" role="region" aria-label={`Ordering steps for ${question.title}`}>
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onKeyUp={(e) => handleKey(e, idx)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Step ${idx + 1}: ${item.description}. Use arrow keys to reorder or drag with mouse.`}
                >
                  <StepItem
                    step={item}
                    index={idx}
                    isDragged={draggedItem?.id === item.id}
                    isDropTarget={dropTargetIndex === idx && draggedItem?.id !== item.id}
                    label={`Step ${idx + 1}`}
                    showInitialHint={!hasInteracted && idx === 0}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                variant="neutral"
                onClick={() => {
                  setItems(initial)
                  persistence.clear()
                  setHasInteracted(false)
                  setShowInstructions(true)
                  sendEvent("ordering.reset", { questionId: question.id })
                }}
                className="font-semibold"
              >
                Reset Order
              </Button>

              <Button
                size="lg"
                variant="default"
                onClick={() => {
                  const indices = items.map((item) => initial.findIndex((s) => s.id === item.id))
                  persistence.save(indices)
                  sendEvent("ordering.save", { questionId: question.id, order: indices })
                }}
                className="font-semibold shadow-lg"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {hasChanged ? (
                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1">
                  <Star className="h-3 w-3 mr-1 inline" />
                  Order modified
                </Badge>
              ) : (
                <Badge variant="neutral" className="px-3 py-1">
                  Original order
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderingQuizSingleEnhanced

const OrderingQuizSingle = OrderingQuizSingleEnhanced
