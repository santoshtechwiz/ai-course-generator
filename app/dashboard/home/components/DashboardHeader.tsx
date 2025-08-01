"use client"

import type React from "react"

import { useState, useEffect, memo } from "react"
import { Card } from "@/components/ui/card"
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
import { CreditCard, LogOut, Settings, User, Menu, BookOpen, BarChart3, Clock, Award } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import type { DashboardUser } from "@/app/types/types"

interface DashboardHeaderProps {
  userData: DashboardUser
  quickStats: Array<{
    icon: React.ReactNode
    label: string
    value: string | number
  }>
  toggleSidebar: () => void
}

// Use memo to prevent unnecessary re-renders
const DashboardHeader = memo(function DashboardHeader({ userData, quickStats, toggleSidebar }: DashboardHeaderProps) {
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  })

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
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col space-y-4">
          {/* Top row with greeting and user menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting}, {memoizedUserData.name || "User"}!
                </h1>
                <p className="text-muted-foreground">
                  {memoizedUserData.streakDays > 0
                    ? `You're on a ${memoizedUserData.streakDays} day learning streak!`
                    : "Start your learning journey today!"}
                </p>
              </div>
            </div>

       
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
            <StatCard
              icon={<BookOpen className="h-5 w-5 text-blue-500" />}
              label="Courses"
              value={quickStats[0].value}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              label="Avg. Score"
              value={`${quickStats[1].value}`}
              bgColor="bg-primary/10"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-purple-500" />}
              label="Learning Time"
              value={`${quickStats[2].value}`}
              unit="min"
              bgColor="bg-purple-50"
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-amber-500" />}
              label="Streak"
              value={quickStats[3].value}
              bgColor="bg-amber-50"
            />
            <StatCard
              icon={<CreditCard className="h-5 w-5 text-green-500" />}
              label="Credits"
              value={memoizedUserData.credits}
              bgColor="bg-green-50"
              className="hidden md:flex"
            />
          </div>
        </div>
      </div>
    </header>
  )
})

// Memoize the StatCard component to prevent unnecessary re-renders
const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  unit,
  bgColor,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  bgColor: string
  className?: string
}) {
  return (
    <div className={`flex items-center p-3 rounded-lg ${bgColor} ${className}`}>
      <div className="mr-3">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold flex items-baseline">
          {value}
          {unit && <span className="text-sm ml-1 font-normal">{unit}</span>}
        </p>
      </div>
    </div>
  )
})

export default DashboardHeader
