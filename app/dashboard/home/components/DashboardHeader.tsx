"use client"

import type React from "react"

import { useState, useEffect, memo } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, LogOut, Settings, User, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import type { DashboardUser } from "@/app/types/types"
import NotificationBell from "./NotificationBell"

interface DashboardHeaderProps {
  userData: DashboardUser
  toggleSidebar: () => void
}

// Use memo to prevent unnecessary re-renders
const DashboardHeader = memo(function DashboardHeader({ userData, toggleSidebar }: DashboardHeaderProps) {
  // Memoize user data to prevent unnecessary re-renders
  const [memoizedUserData, setMemoizedUserData] = useState(userData)

  useEffect(() => {
    // Only update if critical data has changed
    if (
      userData.name !== memoizedUserData.name ||
      userData.image !== memoizedUserData.image ||
      userData.credits !== memoizedUserData.credits ||
      userData.streakDays !== memoizedUserData.streakDays
    ) {
      setMemoizedUserData(userData)
    }
  }, [userData, memoizedUserData])

  return (
    <header className="sticky top-0 z-20 bg-background border-b h-16">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Breadcrumb/Title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>

        {/* Right side - Notifications, Credits, User */}
        <div className="flex items-center gap-3">
          {/* Credits Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-medium">{memoizedUserData.credits || 0} credits</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell userId={memoizedUserData.id} />
            
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={memoizedUserData.image || ""} alt={memoizedUserData.name || "User"} />
                    <AvatarFallback>
                      {memoizedUserData.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{memoizedUserData.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{memoizedUserData.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account">
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  })

export default DashboardHeader
