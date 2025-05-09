"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { TrendingDown, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({ title, value, icon, description, trend, className }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={`p-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>

          <div className="flex flex-col items-end">
            {icon && <div className="p-2 rounded-full bg-primary/10">{icon}</div>}

            {trend && (
              <div className="mt-2 flex items-center">
                {trend === "up" ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Good
                  </span>
                ) : trend === "down" ? (
                  <span className="text-xs text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Needs work
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
