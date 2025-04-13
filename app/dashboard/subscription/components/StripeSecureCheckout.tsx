"use client"

import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SiStripe } from "react-icons/si"
import { motion } from "framer-motion"

export function StripeSecureCheckout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">This site uses Stripe for secure payments</span>
            </div>
            <motion.div
              className="flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <SiStripe className="h-6 w-6 text-slate-900 dark:text-slate-100" />
            </motion.div>
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Learn more about Stripe
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default StripeSecureCheckout
