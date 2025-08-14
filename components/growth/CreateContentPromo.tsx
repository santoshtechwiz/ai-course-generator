"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Rocket, Wand2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateContentPromoProps {
  context?: "quiz" | "results" | "video"
  topic?: string
  className?: string
  storageKey?: string // for dismiss persistence per context/entity, e.g., slug or course id
  onDismiss?: () => void
}

export default function CreateContentPromo({ context = "quiz", topic, className = "", storageKey, onDismiss }: CreateContentPromoProps) {
  const router = useRouter()
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const seen = localStorage.getItem(`promo_create_${context}_${storageKey}`)
      if (seen === "1") setHidden(true)
    } catch {}
  }, [context, storageKey])

  const handleDismiss = () => {
    setHidden(true)
    if (storageKey) {
      try { localStorage.setItem(`promo_create_${context}_${storageKey}`, "1") } catch {}
    }
    onDismiss?.()
  }

  const handleCreate = () => {
    const draft = {
      type: "mcq",
      title: topic || "My Quiz",
      items: [] as any[],
    }
    try { sessionStorage.setItem("create_draft", JSON.stringify(draft)) } catch {}
    router.push("/dashboard/mcq?draft=1")
  }

  if (hidden) return null

  return (
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
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Engage your audience, share expertise, and track progress with AI-powered content. Get started in minutes.
              </p>
              {topic && (
                <p className="mt-1 text-xs text-muted-foreground">Prefill topic: <span className="font-medium text-foreground">{topic}</span></p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={handleCreate} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  <Sparkles className="h-4 w-4" /> Create a quiz
                </Button>
                <Button variant="outline" onClick={handleDismiss} className="gap-2">
                  <X className="h-4 w-4" /> Not now
                </Button>
              </div>
            </div>
            <button aria-label="Dismiss" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}