"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

interface UserProfileProps {
  user: {
    name: string
    email: string
    image: string
    userType: string
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 pb-4">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {user.userType || "Standard"}
            </Badge>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
