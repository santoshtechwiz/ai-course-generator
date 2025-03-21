"use client"

import { useState, useEffect } from "react"
import { Users, UserCheck, UserMinus, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserStats } from "@/app/actions/actions"
import { useToast } from "@/hooks/use-toast"


export function UserStats() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getUserStats()
        if ("error" in result) {
          throw new Error(result.error)
        }
        setStats(result)
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast({
          title: "Error",
          description: "Failed to load user statistics",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  if (loading) {
    return (
      <div className="hidden md:flex items-center justify-center h-[74px] w-[380px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="hidden md:flex gap-4">
      <Card className="w-[120px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>

      <Card className="w-[120px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
        </CardContent>
      </Card>

      <Card className="w-[120px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
          <CardTitle className="text-sm font-medium">Premium</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-2xl font-bold">{stats.premiumUsers}</div>
        </CardContent>
      </Card>
    </div>
  )
}

