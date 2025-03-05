"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, Home, CreditCard } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SuccessContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="space-y-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 mx-auto text-primary" />
          </motion.div>
          <CardTitle>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground"
            >
              Subscription Successful!
            </motion.h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-muted-foreground text-lg"
          >
            Thank you for subscribing to our service. Your account has been upgraded, and you now have access to all the
            features of your new plan.
          </motion.p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button asChild className="w-full">
              <Link href="/dashboard" className="flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Button variant="outline" asChild className="w-full">
              <Link href="/account/billing" className="flex items-center justify-center">
                <CreditCard className="mr-2 h-4 w-4" /> View Billing Details
              </Link>
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}