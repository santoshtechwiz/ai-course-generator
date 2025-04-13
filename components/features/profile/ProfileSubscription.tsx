"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import  {Loader}  from "@/components/ui/loader"

interface Subscription {
  plan: string
  status: string
  renewalDate: string
  tokens: number
}

export default function ProfileSubscription() {
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery<Subscription>({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const response = await axios.get("/api/user/subscription")
      return response.data
    },
  })

  if (isLoading) return <div><Loader></Loader></div>
  if (error) return <div>Error loading subscription info</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>Manage your plan and tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Current Plan:</span>
          <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>{subscription?.plan}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Status:</span>
          <span className={subscription?.status === "active" ? "text-green-600" : "text-red-600"}>
            {subscription?.status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Renewal Date:</span>
          <span>{subscription?.renewalDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Available Tokens:</span>
          <span className="text-xl font-bold">{subscription?.tokens}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Change Plan</Button>
        <Button>Buy Tokens</Button>
      </CardFooter>
    </Card>
  )
}

