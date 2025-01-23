"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button" // Assuming you have a Button component

export function DebugUserInfo() {
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false) // State for minimizing

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || process.env.NODE_ENV !== "development") {
    return null
  }

  if (status === "loading") {
    return <DebugUserInfoSkeleton />
  }

  if (status === "unauthenticated") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug User Info</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? "Expand" : "Minimize"}
          </Button>
        </CardHeader>
        {!isMinimized && (
          <CardContent>
            <Badge variant="destructive">User not authenticated</Badge>
          </CardContent>
        )}
      </Card>
    )
  }

  const userDetails = [
    { key: "Name", value: session?.user?.name },
    { key: "Email", value: session?.user?.email },
    { key: "User ID", value: session?.user?.id },
    { key: "Credits", value: session?.user?.credits },
    { key: "User Type", value: session?.user?.userType },
    { key: "Is Admin", value: session?.user?.isAdmin ? "Yes" : "No" },
    { key: "Subscription Plan", value: session?.user?.subscriptionPlan },
    { key: "Subscription Status", value: session?.user?.subscriptionStatus },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug User Info</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? "Expand" : "Minimize"}
        </Button>
      </CardHeader>
      {!isMinimized && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userDetails.map((detail) => (
                <TableRow key={detail.key}>
                  <TableCell className="font-medium">{detail.key}</TableCell>
                  <TableCell>{detail.value ?? "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  )
}

function DebugUserInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug User Info</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-[200px]" />
      </CardContent>
    </Card>
  )
}
