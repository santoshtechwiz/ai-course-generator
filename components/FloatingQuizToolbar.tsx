"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { QuizActions } from "@/components/QuizActions"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DialogTitle } from "@radix-ui/react-dialog"

interface FloatingQuizToolbarProps {
  quizId: string
  quizSlug: string
  initialIsPublic: boolean
  initialIsFavorite: boolean
  userId: string
  ownerId: string
  quizType?: string
}

export function FloatingQuizToolbar({
  quizId,
  quizSlug,
  initialIsPublic,
  initialIsFavorite,
  userId,
  ownerId,
  quizType,
}: FloatingQuizToolbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  if (userId !== ownerId) {
    return null
  }

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Sheet>
             
              <SheetTrigger asChild>
               
                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full bg-primary shadow-lg hover:bg-primary/90",
                    "dark:bg-primary/90 dark:hover:bg-primary",
                  )}
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
              >
     
     <DialogTitle className="sr-only">Quiz Actions</DialogTitle>           <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quiz Actions</h3>
                  <QuizActions
                    quizId={quizId}
                    quizSlug={quizSlug}
                    initialIsPublic={initialIsPublic}
                    initialIsFavorite={initialIsFavorite}
                    userId={userId}
                    ownerId={ownerId}
                    quizType={quizType}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

