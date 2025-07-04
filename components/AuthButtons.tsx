"use client"

import { LoginButton } from "./LoginButton"
import { LogoutButton } from "./LogoutButton"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function AuthButtons() {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      
      </div>
    )
  }
  
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
          </Avatar>
          <span className="text-sm hidden sm:inline">{user?.name}</span>
        </div>
        <LogoutButton />
      </div>
    )
  }
  
  return <LoginButton />
}
