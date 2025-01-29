"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { XCircle, RefreshCw, Home } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function CancelledContent() {
  useEffect(() => {
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription process was not completed. No payment was processed.",
      variant: "destructive",
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen bg-background p-4"
    >
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold"
            >
              Subscription Canceled
            </motion.h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground"
          >
            Your subscription process was canceled and no payment was processed. Your account status remains unchanged.
          </motion.p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/subscription">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
