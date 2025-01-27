"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/app/types"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"

export default function UserProfile({ user }: { user: User }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-card text-card-foreground overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
              <Avatar className="h-24 w-24 ring-2 ring-primary/10">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="text-lg bg-primary/5">{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Badge>
                {user.role && (
                  <Badge variant="outline" className="bg-primary/5">
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

