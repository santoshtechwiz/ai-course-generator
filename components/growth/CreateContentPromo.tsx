"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Sparkles, 
  Wand2, 
  X, 
  Target, 
  BookOpen, 
  Code2, 
  PenTool, 
  Zap, 
  Lightbulb, 
  Rocket, 
  Star,
  TrendingUp,
  Users,
  Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useGlobalLoader } from "@/store/loaders/global-loader"

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
  const { startLoading } = useGlobalLoader()
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
    startLoading({ message: "Loading...", isBlocking: true, minVisibleMs: 400, autoProgress: true })
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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.1
          }}
          className={cn("relative", className)}
          role="region"
          aria-label="Create your own content promo"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden relative group">
            {/* Animated background elements */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            />
            
            {/* Floating icons */}
            <motion.div
              className="absolute top-4 right-4 text-primary/20"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>

            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-start gap-4">
                <motion.div
                  className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white shadow-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0], 
                    scale: [1, 1.05, 1],
                    y: [0, -2, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, 10, -10, 0]
                  }}
                  aria-hidden
                >
                  <Wand2 className="h-7 w-7" />
                </motion.div>
                
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold leading-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ✨ Create Your Own Quiz for Free
                    </h3>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30 font-semibold px-3 py-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Grow Your Business
                      </Badge>
                    </motion.div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Transform your expertise into engaging, interactive content that captivates your audience and drives results.
                  </p>
                  
                  {topic && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span>Perfect topic: <span className="font-semibold text-foreground">{topic}</span></span>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center gap-3 pt-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={onPrimary} 
                        className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Sparkles className="h-4 w-4" /> 
                        Start Creating
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        onClick={handleDismiss} 
                        className="gap-2 border-2 hover:bg-muted/50 font-medium px-6 py-3 transition-all duration-200"
                      >
                        <X className="h-4 w-4" /> 
                        Maybe Later
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                <motion.button 
                  aria-label="Dismiss" 
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-lg transition-all duration-200" 
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white shadow-lg"
            >
              <Rocket className="h-8 w-8" />
            </motion.div>
            
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Let's Create Something Amazing! 🚀
            </DialogTitle>
            
            <DialogDescription className="text-base text-muted-foreground max-w-md mx-auto">
              Choose your content type and we'll set up everything for you. You can customize all the details later.
            </DialogDescription>
          </DialogHeader>

          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
          >
            <TypeCard 
              label="MCQ Quiz" 
              description="Multiple choice questions"
              active={type === "mcq"} 
              onClick={() => setType("mcq")} 
              Icon={Target}
              color="from-blue-500 to-blue-600"
            />
            <TypeCard 
              label="Flashcards" 
              description="Memory retention"
              active={type === "flashcard"} 
              onClick={() => setType("flashcard")} 
              Icon={BookOpen}
              color="from-green-500 to-green-600"
            />
            <TypeCard 
              label="Fill Blanks" 
              description="Complete the gaps"
              active={type === "blanks"} 
              onClick={() => setType("blanks")} 
              Icon={PenTool}
              color="from-purple-500 to-purple-600"
            />
            <TypeCard 
              label="Code Quiz" 
              description="Programming challenges"
              active={type === "code"} 
              onClick={() => setType("code")} 
              Icon={Code2}
              color="from-orange-500 to-orange-600"
            />
          </motion.div>

          <motion.div 
            className="mt-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Title/Topic
              </label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Data Structures & Algorithms" 
                aria-label="Content title"
                className="h-12 text-base border-2 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                We'll use this to prefill your creation page and suggest relevant content.
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-yellow-500" />
              <span>Public content gets better reach. Premium adds advanced analytics.</span>
            </div>
            
            <div className="flex items-center gap-3">
              {!force && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="px-6 py-3 border-2 font-medium"
                  >
                    Back
                  </Button>
                </motion.div>
              )}
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleStart} 
                  disabled={!type} 
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4" /> 
                  Start Creating
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TypeCard({ 
  label, 
  description,
  active, 
  onClick, 
  Icon, 
  color 
}: { 
  label: string
  description: string
  active: boolean
  onClick: () => void
  Icon: any
  color: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium flex flex-col items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        active 
          ? `bg-gradient-to-br ${color} text-white border-transparent shadow-lg scale-105` 
          : "bg-background hover:bg-muted/50 border-border hover:border-primary/30 hover:scale-105"
      )}
      aria-pressed={active}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className={cn("h-6 w-6", active ? "text-white" : "text-muted-foreground")} />
      <div className="text-center">
        <div className="font-semibold">{label}</div>
        <div className={cn("text-xs mt-1", active ? "text-white/80" : "text-muted-foreground")}>
          {description}
        </div>
      </div>
    </motion.button>
  )
}