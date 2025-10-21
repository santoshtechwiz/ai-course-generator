'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GripVertical, ChevronUp, ChevronDown, Check, Star, ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  difficulty?: 'easy' | 'medium' | 'hard'
  steps: OrderingQuizStep[]
  type?: 'ordering'
}

/* ----------------------------- Hooks -------------------------------- */

// Lightweight analytics hook (replace sendEvent with your implementation)
function useAnalytics() {
  const sendEvent = useCallback((name: string, payload: any = {}) => {
    // TODO: wire to your analytics backend (Segment, Posthog, GA4, etc.)
    // Keep this tiny to save tokens and bandwidth in production.
    if (typeof window === 'undefined') return
    try {
      // Example: window.analytics?.track?.(name, payload)
      console.debug('[analytics]', name, payload)
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

  const save = useCallback((value: number[]) => {
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      // ignore
    }
  }, [key])

  const clear = useCallback(() => {
    if (!key) return
    try { localStorage.removeItem(key) } catch (e) {}
  }, [key])

  return { load, save, clear }
}

/* ----------------------------- Utils -------------------------------- */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  // Simple deterministic-ish shuffle when seed provided; otherwise random
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = seed !== undefined
      ? Math.floor(((seed + i) * 9301 + 49297) % 233280) % (i + 1)
      : Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/* ------------------------- Visual Components ------------------------- */

function DifficultyBadge({ difficulty }: { difficulty?: OrderingQuizQuestion['difficulty'] }) {
  if (!difficulty) return null
  const colors = {
    easy: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    hard: 'bg-red-100 text-red-800 border-red-300',
  }
  return (
    <Badge className={`text-xs font-semibold border-2 ${colors[difficulty]}` as any}>
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
      <g transform={`translate(${size/2}, ${size/2})`}>
        <circle r={radius} fill="transparent" strokeWidth={6} strokeOpacity={0.08} stroke="currentColor" />
        <circle r={radius} fill="transparent" strokeWidth={6} strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
        <text x="0" y="4" textAnchor="middle" fontSize={12} fontWeight={700}>{Math.round(value)}%</text>
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
  onDragStart,
  onDragOver,
  onDragEnd,
  onKeyUp,
  label,
  state,
  dragPosition,
  isDropAbove,
  isDropBelow
}: {
  step: OrderingQuizStep
  index: number
  isDragged: boolean
  isDropTarget: boolean
  onDragStart: (i:number)=>void
  onDragOver: (e: React.DragEvent, i:number)=>void
  onDragEnd: ()=>void
  onKeyUp: (e: React.KeyboardEvent, i:number)=>void
  label: string
  state?: 'default'|'dragging'|'target'|'swapped'
  dragPosition?: { x: number; y: number } | null
  isDropAbove?: boolean
  isDropBelow?: boolean
}) {
  // Generate consistent color based on step ID for visual consistency
  const stepColor = useMemo(() => {
    const colors = [
      'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
      'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800',
      'bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800',
      'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
      'bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800',
      'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:border-cyan-800',
    ];
    const id = typeof step.id === 'string' ? step.id.charCodeAt(0) : step.id;
    return colors[id % colors.length];
  }, [step.id]);

  const textColor = useMemo(() => {
    const colors = [
      'text-blue-800',
      'text-green-800', 
      'text-purple-800',
      'text-amber-800',
      'text-rose-800',
      'text-cyan-800',
    ];
    const id = typeof step.id === 'string' ? step.id.charCodeAt(0) : step.id;
    return colors[id % colors.length];
  }, [step.id]);

  return (
    <div className="relative">
      {/* Drop Area Above Indicator */}
      {isDropAbove && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          className="absolute -top-2 left-0 right-0 mx-4 bg-green-500 rounded-full z-20 shadow-lg"
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
        </motion.div>
      )}

      <motion.div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
        onKeyUp={(e) => onKeyUp(e, index)}
        tabIndex={0}
        role="button"
        aria-label={`${label}: ${step.description}`}
        initial={{ opacity: 1, scale: 1, y: 0 }}
        animate={{
          opacity: isDragged ? 0.8 : 1,
          scale: isDragged ? 1.05 : isDropTarget ? 1.03 : 1,
          y: isDragged ? (dragPosition ? -10 : 0) : 0,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 1.05 }}
        transition={{ 
          duration: 0.2, 
          ease: 'easeOut',
          scale: { duration: 0.15 }
        }}
        className={cn(
          'group flex items-start gap-4 p-4 rounded-lg border-2 transition-all outline-none cursor-grab active:cursor-grabbing relative z-10',
          'hover:shadow-lg hover:border-primary/50',
          state === 'dragging' && 'ring-4 ring-blue-400 z-30 shadow-2xl scale-105',
          state === 'target' && 'ring-2 ring-green-400 shadow-md border-green-300 bg-green-50 dark:bg-green-900/30',
          state === 'swapped' && 'ring-2 ring-purple-400 animate-pulse',
          state === 'default' && 'bg-card border-border',
          // Apply consistent color based on step ID
          stepColor,
          // Highlight drop target area
          isDropTarget && 'bg-green-50 border-green-300 dark:bg-green-900/30'
        )}
        style={{
          transform: isDragged && dragPosition 
            ? `translate(${dragPosition.x}px, ${dragPosition.y}px) rotate(2deg)`
            : undefined,
        }}
      >
        {/* Drag Handle with Improved Visibility */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-md transition-all duration-200 flex items-center gap-1",
            isDragged 
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900 shadow-md" 
              : "bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-sm"
          )}>
            <GripVertical className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <ArrowDownUp className="h-3 w-3 opacity-70" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className={cn("font-semibold text-sm", textColor)}>{step.description}</div>
            <div className={cn(
              "text-xs font-bold px-2 py-1 rounded-full transition-all duration-200 min-w-16 text-center",
              isDragged 
                ? "bg-blue-100 text-blue-700 shadow-sm" 
                : isDropTarget
                ? "bg-green-100 text-green-700 shadow-sm"
                : "bg-white/80 text-gray-700 shadow-sm border"
            )}>
              {isDropTarget ? 'Drop Here' : label}
            </div>
          </div>
          {step.explanation && (
            <div className="mt-2 text-xs text-muted-foreground">{step.explanation}</div>
          )}
        </div>

        {/* Visual indicator for drag state */}
        {isDragged && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none" />
        )}

        {/* Drop Zone Indicator */}
        {isDropTarget && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 border-2 border-dashed border-green-400 rounded-lg pointer-events-none"
          >
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Drop Area Below Indicator */}
      {isDropBelow && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 4 }}
          className="absolute -bottom-2 left-0 right-0 mx-4 bg-green-500 rounded-full z-20 shadow-lg"
        >
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
        </motion.div>
      )}
    </div>
  )
}

/* -------------------- OrderingQuizSingleEnhanced --------------------- */
function OrderingQuizSingleEnhanced({
  question,
  questionNumber = 1,
  totalQuestions = 1,
  onAnswer,
  existingAnswer, // Support for existing answers (e.g., when resuming quiz)
  enablePersistence = true,
  className = ''
}: {
  question: OrderingQuizQuestion
  questionNumber?: number
  totalQuestions?: number
  onAnswer?: (orderedIds: (number|string)[])=>void
  existingAnswer?: number[] // Support existing answer restoration
  enablePersistence?: boolean
  className?: string
}) {
  const { sendEvent } = useAnalytics()
  const persistence = useLocalPersistence(question.id)

  // initial shuffle deterministic by question id to avoid different order each render
  const initial = useMemo(() => {
    const seed = typeof question.id === 'number' ? question.id : String(question.id || question.title).split('').reduce((a,c)=>a+c.charCodeAt(0),0)
    return shuffleArray(question.steps, seed)
  }, [question.id, question.steps])

  // Key observation: When question changes, we need to reset order state
  // Use question.id as dependency to force reset when question changes
  const [order, setOrder] = useState<number[]>(() => {
    // If existingAnswer is provided, use it; otherwise initialize to original order
    if (existingAnswer && Array.isArray(existingAnswer) && existingAnswer.length === initial.length) {
      return existingAnswer
    }
    return initial.map((_, i) => i)
  })
  
  // IMPORTANT: Reset order when question changes (question.id changes)
  useEffect(() => {
    setOrder(() => {
      if (existingAnswer && Array.isArray(existingAnswer) && existingAnswer.length === initial.length) {
        return existingAnswer
      }
      return initial.map((_, i) => i)
    })
  }, [question.id]) // Reset when question ID changes
  
  const [shuffled] = useState<OrderingQuizStep[]>(initial)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [justSwapped, setJustSwapped] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [dropIndicator, setDropIndicator] = useState<'above' | 'below' | 'on' | null>(null)

  // restore from persistence (only on mount if no existingAnswer)
  useEffect(() => {
    if (!enablePersistence || existingAnswer) return
    if (shuffled.length === 0) return
    
    const saved = persistence.load()
    if (saved && Array.isArray(saved) && saved.length === shuffled.length) {
      setOrder(saved)
    }
  }, [question.id]) // Also reset persistence loading when question changes

  // notify parent
  useEffect(() => {
    const ids = order.map(i => shuffled[i]?.id ?? i)
    onAnswer?.(ids)
  }, [order, shuffled, onAnswer])

  // save to local storage throttled
  useEffect(() => {
    if (!enablePersistence) return
    const t = setTimeout(() => persistence.save(order), 250)
    return () => clearTimeout(t)
  }, [order, enablePersistence]) // Remove persistence from deps

  const handleDragStart = useCallback((i:number) => {
    setDraggedIndex(i)
    setDragOverIndex(null)
    setDragPosition({ x: 0, y: 0 })
    setDropIndicator(null)
    sendEvent('ordering.drag_start', { questionId: question.id, index: i })
  }, [question.id, sendEvent])

  const handleDragOver = useCallback((e: React.DragEvent, i:number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === i) return
    
    // Calculate drop position (above, on, or below the item)
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const third = rect.height / 3
    
    let newDropIndicator: 'above' | 'on' | 'below' = 'on'
    if (relativeY < third) {
      newDropIndicator = 'above'
    } else if (relativeY > third * 2) {
      newDropIndicator = 'below'
    } else {
      newDropIndicator = 'on'
    }
    
    setDropIndicator(newDropIndicator)
    setDragPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    
    // Only update order if the target index changes
    if (dragOverIndex !== i) {
      setDragOverIndex(i)

      setOrder(prev => {
        const next = [...prev]
        const item = next.splice(draggedIndex, 1)[0]
        
        // Adjust insertion index based on drop position
        let insertIndex = i
        if (newDropIndicator === 'below' && i < next.length - 1) {
          insertIndex = i + 1
        } else if (newDropIndicator === 'above' && i > 0) {
          insertIndex = i - 1
        }
        
        next.splice(insertIndex, 0, item)
        return next
      })
      
      setJustSwapped(i)
      setTimeout(() => setJustSwapped(null), 300)
      sendEvent('ordering.reorder', { questionId: question.id, from: draggedIndex, to: i, position: newDropIndicator })
    }
  }, [draggedIndex, dragOverIndex, question.id, sendEvent])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDragPosition(null)
    setDropIndicator(null)
    sendEvent('ordering.drag_end', { questionId: question.id })
  }, [sendEvent, question.id])

  const handleKey = useCallback((e: React.KeyboardEvent, i:number) => {
    if (e.key === 'ArrowUp' && i > 0) {
      setOrder(prev => {
        const next = [...prev]
        ;[next[i-1], next[i]] = [next[i], next[i-1]]
        return next
      })
      setJustSwapped(i-1); setTimeout(() => setJustSwapped(null), 300)
      sendEvent('ordering.keyboard_move', { questionId: question.id, from: i, to: i-1 })
    } else if (e.key === 'ArrowDown' && i < order.length - 1) {
      setOrder(prev => {
        const next = [...prev]
        ;[next[i+1], next[i]] = [next[i], next[i+1]]
        return next
      })
      setJustSwapped(i+1); setTimeout(() => setJustSwapped(null), 300)
      sendEvent('ordering.keyboard_move', { questionId: question.id, from: i, to: i+1 })
    }
  }, [order.length, question.id, sendEvent])

  const currentSteps = order.map(idx => shuffled[idx]).filter(Boolean)

  const hasChanged = useMemo(() => order.some((v, i) => v !== i), [order])

  // Quick heuristic correctness indicator (not authoritative) — used for UX
  const isLikelyCorrect = useMemo(() => {
    // if ids are numeric and sequential and match original step ids order, mark as likely correct
    const ids = currentSteps.map(s => s.id)
    const originalIds = question.steps.map(s => s.id)
    if (!originalIds || originalIds.length !== ids.length) return null
    return ids.every((id, i) => id === originalIds[i])
  }, [currentSteps, question.steps])

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <Card className="shadow-lg border">
        <CardHeader className="flex items-start justify-between gap-4 p-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary">Question {questionNumber} / {totalQuestions}</Badge>
              <DifficultyBadge difficulty={question.difficulty} />

              {hasChanged && (
                <Badge className="ml-2 bg-indigo-100 text-indigo-800">Modified</Badge>
              )}
            </div>

            <CardTitle className="mt-3 text-xl font-semibold">{question.title}</CardTitle>
            {question.description && (
              <p className="mt-2 text-sm text-muted-foreground">{question.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="w-16 h-16">
                <QuizProgress value={(order.filter((v,i)=>v===i).length / order.length) * 100} />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-muted-foreground">Quick check</div>
              <div className="flex items-center gap-2">
                {isLikelyCorrect === true && (<div className="inline-flex items-center gap-1 text-green-700"><Check className="h-4 w-4"/> Looks aligned</div>)}
                {isLikelyCorrect === false && (<div className="inline-flex items-center gap-1 text-orange-700"><Star className="h-4 w-4"/> Review</div>)}
                {isLikelyCorrect === null && (<div className="text-muted-foreground text-xs">—</div>)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Drop Zone Instructions */}
          {draggedIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                <GripVertical className="h-4 w-4" />
                <span>Drag to reorder. Green areas show where you can drop.</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4" role="region" aria-label={`Ordering steps for ${question.title}`}>
            <AnimatePresence>
              {currentSteps.map((step, idx) => (
                <StepItem
                  key={`${step.id}-${idx}`}
                  step={step}
                  index={idx}
                  isDragged={draggedIndex === idx}
                  isDropTarget={dragOverIndex === idx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onKeyUp={handleKey}
                  label={`Step ${idx + 1}`}
                  state={draggedIndex === idx ? 'dragging' : (dragOverIndex === idx ? 'target' : (justSwapped === idx ? 'swapped' : 'default'))}
                  dragPosition={draggedIndex === idx ? dragPosition : null}
                  isDropAbove={dragOverIndex === idx && dropIndicator === 'above'}
                  isDropBelow={dragOverIndex === idx && dropIndicator === 'below'}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => { setOrder(initial.map((_, i) => i)); persistence.clear(); sendEvent('ordering.reset', { questionId: question.id }) }}>
                Reset
              </Button>

              <Button size="sm" onClick={() => { persistence.save(order); sendEvent('ordering.save', { questionId: question.id, order }) }}>
                Save
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">{hasChanged ? 'Order modified' : 'Order unchanged'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderingQuizSingleEnhanced

// Backward compatibility alias
const OrderingQuizSingle = OrderingQuizSingleEnhanced

/* -------------------- Notes for Integrators ------------------------- */

/*
Integration suggestions (not included in compiled file):

- Server save: replace persistence.save with an API call to persist to server + DB for paid users.
- Premium hints: provide contextual hints via a paid tier; track hint usage in analytics.
- Timed mode & leaderboards: add a timer and submit times to ranked leaderboards for gamification.
- Batch generation: generate multiple questions via your backend (OpenAI) using the function schema you already built.
- Accessibility: ensure focus styles visible and test with keyboard-only users & screenreaders.

Monetization ideas:
- Sell "Pro" course packs: include curated question banks + video breakdowns.
- Live workshops: allow instructors to run live quizzes and sell seats.
- Analytics dashboard for educators: paid insights into where students fail most.
- Certificates and timed challenges: pay-to-unlock certificates, add badges and verification.
*/