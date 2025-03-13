"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { XCircle, RefreshCw, Home } from "lucide-react"
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
      className="w-full max-w-lg p-4 md:p-0"
    >
      <Card className="border shadow-sm bg-card overflow-hidden">
        <div className="h-2 bg-destructive w-full"></div>
        <CardHeader className="space-y-6 text-center pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto"
          >
            <XCircle className="w-24 h-24 text-destructive mx-auto" />
          </motion.div>
          <CardTitle>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground"
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
            className="text-center text-muted-foreground text-lg leading-relaxed max-w-md mx-auto"
          >
            Your subscription process was canceled and no payment was processed. Your account status remains unchanged.
          </motion.p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button asChild className="w-full h-11 text-base font-medium">
              <Link href="/dashboard/subscription" className="flex items-center justify-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Button variant="outline" asChild className="w-full h-11 text-base font-medium">
              <Link href="/dashboard" className="flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

