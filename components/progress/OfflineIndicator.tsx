"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOfflineIndicator } from '@/hooks/use-offline-progress'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OfflineIndicatorProps {
  className?: string
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-4 left-4',
}

export function OfflineIndicator({
  className,
  position = 'bottom-right'
}: OfflineIndicatorProps) {
  const { showIndicator, status, message } = useOfflineIndicator()

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={cn(
            'fixed z-50 flex items-center gap-2 p-3 rounded-lg shadow-lg',
            status.isOnline ? 'bg-primary/10' : 'bg-warning/10',
            positionClasses[position],
            className
          )}
        >
          {/* Status Icon */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={status.isOnline ? 'online' : 'offline'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'p-2 rounded-full',
                  status.isOnline ? 'bg-primary/20' : 'bg-warning/20'
                )}
              >
                {status.isOnline ? (
                  <Wifi className="w-4 h-4 text-primary" />
                ) : (
                  <WifiOff className="w-4 h-4 text-warning" />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Sync Indicator */}
            {status.isOnline && status.isSyncing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-primary/10"
              >
                <RefreshCw className="w-3 h-3 text-primary" />
              </motion.div>
            )}
          </div>

          {/* Message */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground">
              {status.isOnline ? 'Online' : 'Offline'}
            </p>
            {message && (
              <p className="text-xs text-muted-foreground">
                {message}
              </p>
            )}
          </div>

          {/* Actions */}
          {status.failed > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    // Implement retry logic
                  }}
                >
                  <XCircle className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs">{status.failed} Failed</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to retry failed updates</p>
              </TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineIndicator