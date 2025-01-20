"use client"

import { motion } from "framer-motion"
import { QuizIcon } from "./QuizIcon"
import { Badge } from "./Badge"
import { useColorScheme } from "@/hooks/useColorScheme"
import type { QuizCardProps } from "@/app/types"
import Link from "next/link"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const cardVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: {
    scale: 1.03,
    boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
    transition: { duration: 0.3 },
  },
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0px 0px 15px rgba(var(--primary-rgb), 0.5)",
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.95 },
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  description,
  difficulty,
  questionCount,
  isTrending,
  slug,
  quizType,
}) => {
  const isDarkMode = useColorScheme()

  const backgroundStyle = {
    background: isDarkMode
      ? "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)",
    boxShadow: isDarkMode ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
  }

  return (
    <motion.div
      className="transition-all duration-300 ease-in-out"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card
        className={`w-full max-w-sm rounded-xl overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
        style={backgroundStyle}
      >
        <CardHeader className="relative p-6">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-gradient-to-br from-primary to-transparent" />
          <QuizIcon className="mx-auto text-primary w-16 h-16" />
          <h2 className="text-3xl font-extrabold text-center mt-4 tracking-tight">{title}</h2>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-center text-sm font-medium leading-relaxed">{description}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge text={difficulty} type="difficulty" />
            <Badge text={`${questionCount} Questions`} type="questions" />
            {isTrending && <Badge text="Trending" type="trending" />}
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link
            href={`/dashboard/${quizType === "open-ended" ? "openended" : "mcq"}/${slug}`}
            passHref
            className="block w-full"
          >
            <motion.div variants={buttonVariants} initial="initial" whileHover="hover" whileTap="tap">
              <Button
                className="w-full text-lg font-semibold py-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
                variant="default"
                aria-label={`Start ${title} quiz`}
              >
                Start Quiz
              </Button>
            </motion.div>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

