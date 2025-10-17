"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Bell, BookOpen, BrainCircuit, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation"
import { useAuth } from "@/hooks"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-10">
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-4">Please sign in to view notifications</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbNavigation 
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications", href: "/dashboard/notifications" }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Stay updated with your learning progress and achievements
        </p>
      </div>

      {/* Notification Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Sample notifications */}
          <NotificationCard
            icon={<BrainCircuit className="w-5 h-5" />}
            title="Continue your streak!"
            description="You have 5 flashcards ready for review"
            time="2 hours ago"
            type="flashcard"
            onClick={() => router.push('/dashboard/flashcard/review')}
          />
          
          <NotificationCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Course in progress"
            description="Complete JavaScript Fundamentals - 60% done"
            time="5 hours ago"
            type="course"
            onClick={() => router.push('/dashboard/learn')}
          />

          <NotificationCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Quiz completed!"
            description="You scored 85% on React Basics quiz"
            time="1 day ago"
            type="achievement"
            isRead
          />

          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>You're all caught up!</p>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <NotificationCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Course in progress"
            description="Complete JavaScript Fundamentals - 60% done"
            time="5 hours ago"
            type="course"
            onClick={() => router.push('/dashboard/learn')}
          />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <NotificationCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            title="Quiz completed!"
            description="You scored 85% on React Basics quiz"
            time="1 day ago"
            type="achievement"
            isRead
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationCardProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  type: "course" | "flashcard" | "achievement"
  isRead?: boolean
  onClick?: () => void
}

function NotificationCard({
  icon,
  title,
  description,
  time,
  type,
  isRead = false,
  onClick
}: NotificationCardProps) {
  return (
    <Card 
      className={cn(
        "transition-colors cursor-pointer hover:bg-accent/50",
        !isRead && "border-primary/50 bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg",
            type === "course" && "bg-primary/10 text-primary",
            type === "flashcard" && "bg-secondary/10 text-secondary",
            type === "achievement" && "bg-success/10 text-success"
          )}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              {!isRead && (
                <Badge variant="secondary" className="shrink-0">New</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{time}</span>
              {onClick && (
                <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
