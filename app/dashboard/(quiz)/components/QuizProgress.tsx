"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface QuizProgressProps {
  current: number
  total: number
  percentage: number
}

export const QuizProgress: React.FC<QuizProgressProps> = ({ 
  current, 
  total, 
  percentage 
}) => {
  // Ensure percentage is valid
  const validPercentage = isNaN(percentage) ? 0 : Math.min(Math.max(percentage, 0), 100)
  
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">
          Question {current} of {total}
        </span>
        <span className="text-sm font-medium">
          {Math.round(validPercentage)}% Complete
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={validPercentage} 
          className="h-2 w-full" 
        />
        
        {validPercentage === 100 && (
          <motion.div 
            className="absolute right-0 top-0 transform -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </motion.div>
        )}
      </div>
      
      <div className="flex justify-between mt-1">
        <div className="flex space-x-1">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 w-1 rounded-full ${
                i < current ? "bg-primary" : "bg-muted"
              }`}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: i === current - 1 ? 1.2 : 1,
                opacity: i < current ? 1 : 0.5
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
