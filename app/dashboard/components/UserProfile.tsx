'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardUser } from "@/app/types"


interface UserProfileProps {
  user: Pick<DashboardUser, 'name' | 'email' | 'image' | 'userType' | 'totalCoursesWatched' | 'totalQuizzesAttempted'>
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary">{user.userType || 'Standard'}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Courses Watched</p>
            <p className="text-2xl font-bold">{user.totalCoursesWatched}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Quizzes Taken</p>
            <p className="text-2xl font-bold">{user.totalQuizzesAttempted}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

