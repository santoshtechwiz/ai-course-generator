/**
 * Action Buttons Component
 * Displays clickable action buttons in chat messages
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChatAction } from '@/types/chat.types'
import { 
  BookOpen, 
  FileQuestion, 
  Plus, 
  TrendingUp, 
  ExternalLink,
  ArrowRight 
} from 'lucide-react'

interface ActionButtonsProps {
  actions: ChatAction[]
  onActionClick?: (action: ChatAction) => void
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  actions, 
  onActionClick 
}) => {
  const router = useRouter()

  if (!actions || actions.length === 0) {
    return null
  }

  const handleClick = (action: ChatAction) => {
    // Call custom handler if provided
    if (onActionClick) {
      onActionClick(action)
    }

    // Navigate to URL if provided
    if (action.url) {
      if (action.type === 'external_link') {
        window.open(action.url, '_blank', 'noopener,noreferrer')
      } else {
        router.push(action.url)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: ChatAction) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(action)
    }
  }

  const getIcon = (type: ChatAction['type']) => {
    switch (type) {
      case 'view_course':
        return <BookOpen className="h-4 w-4" />
      case 'view_quiz':
        return <FileQuestion className="h-4 w-4" />
      case 'create_quiz':
        return <Plus className="h-4 w-4" />
      case 'upgrade_plan':
        return <TrendingUp className="h-4 w-4" />
      case 'external_link':
        return <ExternalLink className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  const getVariant = (type: ChatAction['type']): 'default' | 'neutral' => {
    if (type === 'create_quiz' || type === 'upgrade_plan') {
      return 'default'
    }
    return 'neutral'
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Available actions">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={getVariant(action.type)}
          size="sm"
          onClick={() => handleClick(action)}
          onKeyDown={(e) => handleKeyDown(e, action)}
          className="gap-2 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          tabIndex={0}
          aria-label={`${action.label}${action.type === 'external_link' ? ' (opens in new tab)' : ''}`}
        >
          {getIcon(action.type)}
          {action.label}
        </Button>
      ))}
    </div>
  )
}

export default ActionButtons
