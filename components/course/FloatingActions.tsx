'use client'

import { useState } from 'react'
import { Plus, Heart, Bookmark, Share2, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingActionsProps {
  onLike?: () => void
  onBookmark?: () => void
  onShare?: () => void
  onComment?: () => void
  onAddNote?: () => void
}

export function FloatingActions({
  onLike,
  onBookmark,
  onShare,
  onComment,
  onAddNote
}: FloatingActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.()
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.()
  }

  const actions = [
    {
      icon: Heart,
      label: 'Like',
      action: handleLike,
      active: isLiked,
      color: 'text-red-500'
    },
    {
      icon: Bookmark,
      label: 'Save',
      action: handleBookmark,
      active: isBookmarked,
      color: 'text-blue-500'
    },
    {
      icon: Share2,
      label: 'Share',
      action: onShare,
      color: 'text-green-500'
    },
    {
      icon: MessageCircle,
      label: 'Comment',
      action: onComment,
      color: 'text-purple-500'
    },
    {
      icon: Plus,
      label: 'Note',
      action: onAddNote,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col items-center space-y-3 transition-all duration-300",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <button
            key={action.label}
            onClick={action.action}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105",
              action.active && "ring-2 ring-blue-500"
            )}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <action.icon className={cn("w-5 h-5", action.color)} />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center",
          isExpanded && "rotate-45"
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Pulse Animation */}
      {!isExpanded && (
        <div className="absolute inset-0 animate-ping">
          <div className="w-full h-full bg-blue-400 rounded-full opacity-20" />
        </div>
      )}
    </div>
  )
}