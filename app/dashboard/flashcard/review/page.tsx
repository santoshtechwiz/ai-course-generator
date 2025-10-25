"use client"

import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StreakBanner } from "@/components/flashcard/StreakBanner"
import { ReviewStats } from "@/components/flashcard/ReviewStats"
import { BadgeShowcase } from "@/components/flashcard/BadgeShowcase"
import { ReviewCalendar } from "@/components/flashcard/ReviewCalendar"
import { BreadcrumbNavigation, LearningDashboardLink } from "@/components/navigation/BreadcrumbNavigation"
import { PageLoader } from "@/components/loaders"
import { Brain, Play, Calendar, Trophy } from "lucide-react"
import { useAuth } from "@/hooks"
import { Badge } from "@/components/ui/badge"

export default function ReviewDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const { data: dueCards, isLoading } = useQuery({
    queryKey: ['due-cards', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/flashcards/due?limit=20')
      if (!response.ok) throw new Error('Failed to fetch due cards')
      return response.json()
    },
    enabled: !!user?.id,
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-4">Please sign in to view your flashcard reviews</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <BreadcrumbNavigation 
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Flashcards", href: "/dashboard/flashcard" },
              { label: "Review", href: "/dashboard/flashcard/review" }
            ]}
          />
          <LearningDashboardLink />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-[var(--color-primary)]/20">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-[var(--color-primary)]">
            Review Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Keep your knowledge fresh with spaced repetition
          </p>
        </div>

        {/* Streak Banner */}
        <StreakBanner userId={user.id} />

        {/* Review Stats */}
        <ReviewStats userId={user.id} />

        {/* Badge Showcase */}
        <BadgeShowcase />

        {/* Review Calendar Heatmap */}
        <ReviewCalendar userId={user.id} />

        {/* Due Cards Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Cards Due for Review
              </CardTitle>
              {dueCards && dueCards.count > 0 && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {dueCards.count} cards
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12">
                <PageLoader message="Loading your review cards..." />
              </div>
            ) : dueCards && dueCards.count > 0 ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  You have <strong className="text-foreground">{dueCards.count} cards</strong> ready for review.
                  Reviewing now will help reinforce your memory at the optimal time!
                </p>

                {/* Cards Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dueCards.cards.slice(0, 6).map((card: any) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {card.flashCard.userQuiz?.title || 'Flashcard'}
                        </p>
                        <p className="text-base font-semibold line-clamp-2">
                          {card.flashCard.question}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Review #{card.reviewCount + 1}
                          </Badge>
                          {card.interval > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {card.interval}d interval
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {dueCards.count > 6 && (
                  <p className="text-center text-sm text-muted-foreground">
                    + {dueCards.count - 6} more cards ready for review
                  </p>
                )}

                {/* Start Review Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-base font-bold bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-[var(--color-text)] shadow-neo hover:shadow-neo-hover neo-hover-lift transition-all"
                    onClick={() => {
                      // TODO: Implement review session with specific cards
                      const firstCard = dueCards.cards[0]
                      if (firstCard?.flashCard?.userQuiz?.slug) {
                        router.push(`/dashboard/flashcard/${firstCard.flashCard.userQuiz.slug}`)
                      }
                    }}
                  >
                    <Play className="h-6 w-6 mr-2 fill-current" />
                    Start Review Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground mb-6">
                  No cards due for review right now. Come back later!
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/quizzes')}
                >
                  Explore More Quizzes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/quizzes')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Browse Flashcards</h3>
                <p className="text-sm text-muted-foreground">Discover new topics to learn</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/create-quiz')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Play className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Create Flashcards</h3>
                <p className="text-sm text-muted-foreground">Make your own study materials</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
