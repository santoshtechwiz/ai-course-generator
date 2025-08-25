"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sparkles, Wand2, X, Target, BookOpen, Code2, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateContentPromoProps {
  context?: "quiz" | "results" | "video"
  topic?: string
  className?: string
  storageKey?: string
  onDismiss?: () => void
  force?: boolean // if true, modal opens immediately and blocks until user chooses
}

type ContentType = "mcq" | "code" | "blanks" | "flashcard"

export default function CreateContentPromo({ context = "quiz", topic, className = "", storageKey, onDismiss, force = false }: CreateContentPromoProps) {
  const router = useRouter()
  const [hidden, setHidden] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<ContentType | null>(null)
  const [title, setTitle] = React.useState<string>(topic || "")

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const seen = localStorage.getItem(`promo_create_${context}_${storageKey}`)
      if (seen === "1" && !force) setHidden(true)
    } catch {}
  }, [context, storageKey, force])

  React.useEffect(() => {
    if (force && !hidden) setOpen(true)
  }, [force, hidden])

  const handleDismiss = () => {
    setHidden(true)
    if (storageKey) {
      try { localStorage.setItem(`promo_create_${context}_${storageKey}`, "1") } catch {}
    }
    setOpen(false)
    onDismiss?.()
  }

  const onPrimary = () => setOpen(true)

  const handleStart = () => {
    if (!type) return
    const draft = {
      type,
      title: title?.trim() || topic || "My Quiz",
      items: [] as any[],
    }
    try { sessionStorage.setItem("create_draft", JSON.stringify(draft)) } catch {}
    // Show loader immediately to avoid blank state while navigating
    const map: Record<ContentType, string> = {
      mcq: "/dashboard/mcq?draft=1",
      code: "/dashboard/code?draft=1",
      blanks: "/dashboard/blanks?draft=1",
      flashcard: "/dashboard/flashcard?draft=1",
    }
    router.push(map[type])
  }

  if (hidden && !force) return null

  return (
    <>
      {!force && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn("relative", className)}
          role="region"
          aria-label="Create your own content promo"
        >
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 via-background to-primary/10">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <motion.div
                  className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary"
                  animate={{ rotate: [0, 10, -8, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                >
                  <Wand2 className="h-5 w-5" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold leading-tight">Create your own quiz for free</h3>
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">Grow your business</Badge>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Engage your audience, share expertise, and track progress with AI-powered content.</p>
                  {topic && (
                    <p className="mt-1 text-xs text-muted-foreground">Prefill topic: <span className="font-medium text-foreground">{topic}</span></p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button onClick={onPrimary} className="gap-2 bg-gradient-to-r from-primary to-primary/80"><Sparkles className="h-4 w-4" /> Create</Button>
                    <Button variant="outline" onClick={handleDismiss} className="gap-2"><X className="h-4 w-4" /> Not now</Button>
                  </div>
                </div>
                <button aria-label="Dismiss" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Let’s create your content</DialogTitle>
            <DialogDescription>Pick a type and we’ll prefill the builder for you. You can change details later.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TypeCard label="MCQ" active={type === "mcq"} onClick={() => setType("mcq")} Icon={Target} />
            <TypeCard label="Flashcards" active={type === "flashcard"} onClick={() => setType("flashcard")} Icon={BookOpen} />
            <TypeCard label="Blanks" active={type === "blanks"} onClick={() => setType("blanks")} Icon={PenTool} />
            <TypeCard label="Code" active={type === "code"} onClick={() => setType("code")} Icon={Code2} />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Title/Topic</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Data Structures" aria-label="Content title" />
            <p className="text-xs text-muted-foreground">We’ll use this to prefill the creation page.</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Public content gets better reach. Premium adds analytics.</p>
            <div className="flex items-center gap-2">
              {!force && <Button variant="outline" onClick={() => setOpen(false)}>Back</Button>}
              <Button onClick={handleStart} disabled={!type} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Sparkles className="h-4 w-4" /> Start
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TypeCard({ label, active, onClick, Icon }: { label: string; active: boolean; onClick: () => void; Icon: any }) {
  return (
    <button
      onClick={onClick}
      className={cn("p-3 rounded-lg border transition-all text-sm font-medium flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary", active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/50")}
      aria-pressed={active}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  )
}