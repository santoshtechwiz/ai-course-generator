'use client'

import { useState, useEffect } from 'react'
import { Crown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscribeButtonProps {
  isVisible: boolean
  onClick: () => void
}

export function SubscribeButton({ isVisible, onClick }: SubscribeButtonProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Show pulse animation after 3 seconds
      const pulseTimer = setTimeout(() => {
        setShowPulse(true)
      }, 3000)

      return () => clearTimeout(pulseTimer)
    }
  }, [isVisible])

  if (!isVisible || isHidden) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Pulse Animation */}
      {showPulse && (
        <div className="absolute inset-0 animate-ping">
          <div className="w-full h-full bg-blue-500 rounded-full opacity-20" />
        </div>
      )}

      {/* Main Button */}
      <div className="relative">
        <button
          onClick={onClick}
          className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <Crown className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold text-sm">Unlock Full Course</div>
              <div className="text-xs opacity-90">Subscribe Now</div>
            </div>
          </div>
        </button>

        {/* Close Button */}
        <button
          onClick={() => setIsHidden(true)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-4 -left-4 animate-bounce">
        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
      </div>
      <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <div className="w-2 h-2 bg-green-400 rounded-full" />
      </div>
    </div>
  )
}