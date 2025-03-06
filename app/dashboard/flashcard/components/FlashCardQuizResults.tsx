"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, BookOpen, RotateCcw, Bookmark, ThumbsUp, ThumbsDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface QuizResultsProps {
  totalCards: number
  knownCards: number
  reviewCards: number
  savedCards: number
  topic: string
  onRestart: () => void
}

export function QuizResults({ totalCards, knownCards, reviewCards, savedCards, topic, onRestart }: QuizResultsProps) {
  const score = Math.round((knownCards / totalCards) * 100)
  const remainingCards = totalCards - knownCards - reviewCards

  // Trigger confetti effect when component mounts
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-8">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-3xl font-bold">Quiz Complete!</CardTitle>
          <CardDescription className="text-lg">
            You've completed the {topic} flashcards. Here's how you did:
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border shadow-md overflow-hidden">
        <div className="bg-primary h-2">
          <div className="bg-green-600 h-full" style={{ width: `${score}%` }}></div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Your Results</CardTitle>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{score}%</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  Known
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">{knownCards}</div>
                <Progress
                  value={(knownCards / totalCards) * 100}
                  className="h-2 mt-2 bg-gray-100"
                  indicatorClassName="bg-green-600"
                />
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-amber-600" />
                  Need Review
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">{reviewCards}</div>
                <Progress
                  value={(reviewCards / totalCards) * 100}
                  className="h-2 mt-2 bg-gray-100"
                  indicatorClassName="bg-amber-600"
                />
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  Saved
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">{savedCards}</div>
                <Progress value={(savedCards / totalCards) * 100} className="h-2 mt-2 bg-gray-100" />
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Summary</h3>
            <p>
              You've mastered {knownCards} out of {totalCards} cards ({score}%).
              {reviewCards > 0 ? ` You have ${reviewCards} cards that need more review.` : ""}
              {savedCards > 0 ? ` You saved ${savedCards} cards for later reference.` : ""}
            </p>

            {score >= 80 ? (
              <p className="mt-2 text-green-600 font-medium">
                Great job! You've shown excellent understanding of this topic.
              </p>
            ) : score >= 50 ? (
              <p className="mt-2 text-amber-600 font-medium">
                Good progress! With a bit more practice, you'll master this topic.
              </p>
            ) : (
              <p className="mt-2 text-red-600 font-medium">Keep practicing! This topic needs more of your attention.</p>
            )}
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="p-6 flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart Quiz
          </Button>

          <Button variant="default" className="w-full sm:w-auto">
            <BookOpen className="h-4 w-4 mr-2" />
            Review Saved Cards
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-center">
        <Button variant="link" onClick={() => (window.location.href = "/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}

