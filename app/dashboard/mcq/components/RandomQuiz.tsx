"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { RandomQuizProps } from "@/app/types"
import { QuizCard } from "@/app/components/shared/QuizCard"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0, y: 20 },
}

const RandomQuiz: React.FC<RandomQuizProps> = ({ games }) => {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const displayedGames = showAll ? games : games.slice(0, 3)

  return (
    <motion.div
      className="w-full max-w-3xl "
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-secondary p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Random Quiz</h2>
              <p className="text-sm text-muted-foreground">Explore a selection of random quizzes tailored to different topics.</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full hover:bg-muted" aria-label="Close quiz selection">
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close quiz selection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quiz Cards */}
        <div className="p-4">
          <div className="grid gap-4">
            <AnimatePresence mode="wait">
              {displayedGames.map((game:any) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuizCard
                    title={game.topic}
                    questionCount={game.totalQuestions}
                    slug={game.slug}
                    quizType="mcq"
                    estimatedTime="5 min"
                    isTrending={game.isTrending}
                    description={game.description}
                    difficulty={game.difficulty}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show More/Less Button */}
          {games.length > 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
              <Button variant="outline" onClick={() => setShowAll(!showAll)} className="w-full">
                {showAll ? (
                  <>
                    Show Less
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show More
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">{`Showing ${displayedGames.length} of ${games.length} quizzes`}</p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default RandomQuiz

