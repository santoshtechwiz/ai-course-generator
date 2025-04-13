"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import  {Loader}  from "@/components/ui/loader"

interface UserStats {
  totalCourses: number
  completedCourses: number
  totalQuizzes: number
  averageScore: number
}

export default function ProfileStats() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<UserStats>({
    queryKey: ["userStats"],
    queryFn: async () => {
      const response = await axios.get("/api/user/stats")
      return response.data
    },
  })

  if (isLoading) return <div><Loader></Loader></div>
  if (error) return <div>Error loading stats</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalCourses}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedCourses}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalQuizzes}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.averageScore}%</div>
        </CardContent>
      </Card>
    </div>
  )
}

