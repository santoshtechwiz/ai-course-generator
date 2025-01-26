"use client"

import { FC } from "react"
import Link from "next/link"
import {
  Clock,
  Star,
  Zap,
  ArrowRight,
  HelpCircle,
  Brain,
  Trophy,
  CheckSquare,
  AlignLeft,
  FileInput,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface QuizCardProps {
  title: string
  questionCount: number
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks"
  estimatedTime?: string
  description: string
  isPublic?: boolean
  tags?: string[]
}

const quizTypeIcons = {
  mcq: CheckSquare,
  openended: AlignLeft,
  "fill-blanks": FileInput,
}

const quizTypeColors = {
  mcq: { gradient: ["#3b82f6", "#2563eb"], badge: "bg-blue-500" }, // Blue
  openended: { gradient: ["#22c55e", "#16a34a"], badge: "bg-green-500" }, // Green
  "fill-blanks": { gradient: ["#a78bfa", "#7c3aed"], badge: "bg-purple-500" }, // Purple
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
}

function getQuizTypeRoute(quizType: string): string {
  switch (quizType) {
    case "mcq":
      return "mcq"
    case "openended":
      return "openended"
    case "fill-blanks":
      return "blanks"
    default:
      return "quiz"
  }
}

export const QuizCard: FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  isPublic = false,
  tags = [],
}) => {
  const QuizTypeIcon = quizTypeIcons[quizType]

  return (
    <div className="max-w-sm mx-auto">
      <div className="h-full transition-transform duration-300 hover:scale-105">
        <Card
          className={cn(
            "overflow-hidden h-full",
            "hover:shadow-lg hover:border-primary/20",
            "dark:bg-card dark:text-card-foreground",
          )}
        >
          <CardHeader className="relative p-6 pb-0">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${quizTypeColors[quizType].gradient[0]}, ${quizTypeColors[quizType].gradient[1]})`,
              }}
            />
            <div className="relative z-10 mb-4 mx-auto">
              <div className="size-20 mx-auto bg-background/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                <QuizTypeIcon className="size-10 text-primary" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Badge className={`font-medium text-white ${quizTypeColors[quizType].badge}`}>
                {quizTypeLabels[quizType]}
              </Badge>
              <Badge variant="outline" className="font-medium">
                <Clock className="size-3 mr-1" />
                {estimatedTime}
              </Badge>
              {isPublic && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 font-medium">
                  <Zap className="size-3 mr-1" />
                  Trending
                </Badge>
              )}
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="default"
                  className={cn(
                    "font-medium",
                    tag === "New" && "bg-yellow-500 hover:bg-yellow-600",
                    tag === "Popular" && "bg-red-500 hover:bg-red-600",
                  )}
                >
                  {tag === "New" && <Star className="size-3 mr-1" />}
                  {tag === "Popular" && <Trophy className="size-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>

            <CardTitle className="text-2xl font-bold text-center relative z-10">{title}</CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center">
                <HelpCircle className="size-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">{questionCount} Questions</span>
              </div>
              <div className="flex items-center">
                <Brain className="size-4 mr-2 text-indigo-500" />
                <span className="text-muted-foreground">Boost Knowledge</span>
              </div>
            </div>
            <CardDescription className="text-center">{description}</CardDescription>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Link
              href={`/dashboard/${getQuizTypeRoute(quizType)}/${slug}`}
              className={cn(
                "w-full group relative overflow-hidden",
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "h-11 px-8 py-2",
              )}
            >
              Start Quiz
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
