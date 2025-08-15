"use client"

import { motion } from "framer-motion"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"

/**
 * Modern Module Loading Component
 * 
 * This component provides a consistent loading state for all modules
 * using the new modern loader design instead of skeletons.
 * 
 * @returns A modern loading UI for the module being loaded
 */
export function ModuleLoading() {
  return (
    <ModuleLayout>
      <motion.div 
        className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner size={48} />
        
        <div className="text-center space-y-2">
          <motion.h2 
            className="text-xl font-semibold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Loading Content
          </motion.h2>
          
          <motion.p 
            className="text-sm text-muted-foreground max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Please wait while we prepare your content...
          </motion.p>
        </div>
      </motion.div>
    </ModuleLayout>
  )
}
