"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Loader2 } from 'lucide-react'
import { ShareModal } from './ShareModal'

interface ShareButtonProps {
  resourceType: 'course' | 'quiz'
  resourceId: number | string
  resourceTitle: string
  resourceSlug?: string
  variant?: 'default' | 'noShadow' | 'neutral' | 'reverse'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

/**
 * ShareButton - Reusable share button component that opens a share modal
 * Integrates with the Share Module for secure token-based sharing
 * 
 * @param resourceType - 'course' or 'quiz'
 * @param resourceId - ID of the resource to share
 * @param resourceTitle - Display title of the resource
 * @param resourceSlug - Optional slug for URL generation
 * @param variant - Button style variant
 * @param size - Button size
 * @param showLabel - Whether to show "Share" text label
 * @param className - Additional CSS classes
 */
export function ShareButton({
  resourceType,
  resourceId,
  resourceTitle,
  resourceSlug,
  variant = 'default',
  size = 'default',
  showLabel = true,
  className = '',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenModal = () => {
    setIsOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        disabled={isLoading}
        className={className}
        title={`Share this ${resourceType} with friends`}
        aria-label={`Share ${resourceTitle}`}
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="ml-2">Share</span>}
      </Button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resourceType={resourceType}
        resourceId={Number(resourceId)}
        resourceTitle={resourceTitle}
        resourceSlug={resourceSlug}
        onLoadingChange={setIsLoading}
      />
    </>
  )
}
