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
import { cn, getColorClasses } from "@/lib/utils"

interface DashboardHeaderProps {
  userData: DashboardUser
  toggleSidebar: () => void
}

// Use memo to prevent unnecessary re-renders
const DashboardHeader = memo(function DashboardHeader({ userData, toggleSidebar }: DashboardHeaderProps) {
  // Memoize user data to prevent unnecessary re-renders
  const [memoizedUserData, setMemoizedUserData] = useState(userData)
  
  // Get Neobrutalism utility classes
  const { buttonIcon, badgeCount, cardSecondary } = getColorClasses()

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
    <header className="sticky top-0 z-20 bg-background border-b-4 border-border h-16 shadow-[0_4px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Breadcrumb/Title */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className={cn(
              "lg:hidden",
              buttonIcon,
              "hover:translate-y-[-2px] transition-all duration-100"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black">Dashboard</h1>
          </div>
        </div>

        {/* Right side - Notifications, Credits, User */}
        <div className="flex items-center gap-3">
          {/* Credits Badge - Neobrutalism style */}
          <div 
            className={cn(
              "hidden sm:flex items-center gap-2 px-4 py-2",
              "bg-background text-foreground",
              "border-3 border-border rounded-lg",
              "shadow-[3px_3px_0px_0px_hsl(var(--border))]",
              "font-bold"
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-black">{memoizedUserData.credits || 0}</span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell userId={memoizedUserData.id} />
            
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "relative h-10 w-10 rounded-full",
                    "border-3 border-border",
                    "shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                    "hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]",
                    "hover:translate-y-[-2px]",
                    "transition-all duration-100"
                  )}
                >
                  <Avatar className="h-8 w-8 border-2 border-border">
                    <AvatarImage src={memoizedUserData.image || ""} alt={memoizedUserData.name || "User"} />
                    <AvatarFallback className="bg-main text-main-foreground font-bold">
                      {memoizedUserData.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className={cn(
                  "w-56",
                  "bg-background border-4 border-border rounded-xl",
                  "shadow-[8px_8px_0px_0px_hsl(var(--border))]"
                )}
                align="end" 
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-3 border-b-3 border-border bg-secondary-background">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{memoizedUserData.name}</p>
                    <p className="text-xs leading-none text-muted-foreground font-medium">{memoizedUserData.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border h-[3px]" />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/dashboard/account"
                    className={cn(
                      "flex items-center p-3 font-bold rounded-md m-1",
                      "border-2 border-transparent",
                      "hover:border-border hover:bg-secondary-background",
                      "hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]",
                      "transition-all duration-100"
                    )}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border h-[3px]" />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className={cn(
                    "cursor-pointer p-3 font-bold rounded-md m-1",
                    "border-2 border-transparent",
                    "hover:border-destructive hover:bg-destructive/10",
                    "hover:shadow-[2px_2px_0px_0px_hsl(var(--destructive))]",
                    "text-destructive transition-all duration-100"
                  )}
                >
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
