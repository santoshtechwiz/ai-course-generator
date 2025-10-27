"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'course' | 'quiz'
  resourceId: number
  resourceTitle: string
  resourceSlug?: string
  onLoadingChange?: (loading: boolean) => void
}

/**
 * ShareModal - Modal component for sharing courses and quizzes
 * Displays shareable link, optional access key, and copy-to-clipboard functionality
 * Integrates with the Share Module API
 */
export function ShareModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  resourceSlug,
  onLoadingChange,
}: ShareModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareData, setShareData] = useState<any>(null)
  const [copied, setCopied] = useState<string | false>(false)
  const [withAccessKey, setWithAccessKey] = useState(false)
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  const [visibility, setVisibility] = useState<'link-only' | 'public'>('link-only')
  const [showKey, setShowKey] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state for client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setShareData(null)
      setCopied(false)
    }
  }, [isOpen])

  // Generate share link by calling API
  const generateShareLink = async () => {
    setIsLoading(true)
    setError(null)
    onLoadingChange?.(true)

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: resourceType,
          id: resourceId,
          withAccessKey,
          expiryDays,
          visibility,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link')
      }

      // Construct full URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const fullUrl = `${baseUrl}/share/${resourceType}/${data.shareUrl.split('/').pop()}`

      setShareData({
        ...data,
        shareUrl: fullUrl,
      })
    } catch (err: any) {
      console.error('Share error:', err)
      setError(err.message || 'Failed to generate share link')
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string = 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      // Fallback: try using execCommand
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(type)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setError(null)
    setShareData(null)
    onClose()
  }

  // Don't render until mounted or modal is closed
  if (!isMounted || !isOpen) {
    return null
  }

  // Render modal in portal
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-40"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-2xl mx-auto md:left-1/2 md:-translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            <Card className="bg-background border-3 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))]">
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 id="share-modal-title" className="text-2xl font-black tracking-tight">
                      Share with Friends
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {resourceTitle}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-muted rounded-none transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Loading state */}
                {isLoading && (
                  <div className="py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Generating share link...</p>
                  </div>
                )}

                {/* Error state */}
                {error && !isLoading && (
                  <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive rounded-none flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">{error}</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Please check your permissions or try again.
                      </p>
                    </div>
                  </div>
                )}

                {/* Options screen (before generation) */}
                {!isLoading && !shareData && !error && (
                  <div className="space-y-4">
                    {/* Access Key Toggle */}
                    <div className="border-2 border-border rounded-none p-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-semibold block">
                            Optional Access Key
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add extra security
                          </p>
                        </div>
                        <button
                          onClick={() => setWithAccessKey(!withAccessKey)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            withAccessKey
                              ? 'bg-[hsl(var(--primary))]'
                              : 'bg-muted'
                          )}
                          role="switch"
                          aria-checked={withAccessKey}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              withAccessKey ? 'translate-x-5' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Expiry Option */}
                    <div className="border-2 border-border rounded-none p-4 bg-muted/30">
                      <label className="text-sm font-semibold block mb-3">
                        Link Expiry
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[null, 1, 7, 30].map((days) => (
                          <button
                            key={days ?? 'never'}
                            onClick={() => setExpiryDays(days)}
                            className={cn(
                              'px-3 py-2 rounded-none text-sm font-medium transition-all border-2',
                              expiryDays === days
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:border-primary/50'
                            )}
                          >
                            {days === null ? 'Never' : `${days}d`}
                          </button>
                        ))}
                      </div>
                      {expiryDays && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          ℹ️ Expires: {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Visibility Option */}
                    <div className="border-2 border-border rounded-none p-4 bg-muted/30">
                      <label className="text-sm font-semibold block mb-3">
                        Link Visibility
                      </label>
                      <div className="flex gap-2">
                        {['link-only', 'public'].map((vis) => (
                          <button
                            key={vis}
                            onClick={() => setVisibility(vis as 'link-only' | 'public')}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-none text-sm font-medium transition-all border-2',
                              visibility === vis
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:border-primary/50'
                            )}
                          >
                            {vis === 'link-only' ? 'Link Only' : 'Public'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {visibility === 'public'
                          ? '🌐 Anyone can access with the link'
                          : '🔗 Access key required if set'}
                      </p>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateShareLink}
                      disabled={isLoading}
                      className="w-full font-semibold"
                      size="lg"
                    >
                      Generate Share Link
                    </Button>
                  </div>
                )}

                {/* Results screen (after generation) */}
                {!isLoading && shareData && !error && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-none">
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        ✓ Share link created!
                      </p>
                    </div>

                    {/* Share URL */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Share URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareData.shareUrl || ''}
                          readOnly
                          className="flex-1 px-3 py-2 border-2 border-border rounded-none bg-muted text-sm font-mono"
                        />
                        <Button
                          onClick={() => copyToClipboard(shareData.shareUrl, 'url')}
                          size="sm"
                          variant="noShadow"
                        >
                          {copied === 'url' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Access Key (if set) */}
                    {shareData.accessKey && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Access Key</label>
                        <div className="flex gap-2">
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={shareData.accessKey}
                            readOnly
                            className="flex-1 px-3 py-2 border-2 border-border rounded-none bg-muted text-sm font-mono"
                          />
                          <Button
                            onClick={() => setShowKey(!showKey)}
                            size="sm"
                            variant="noShadow"
                          >
                            {showKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(shareData.accessKey, 'key')}
                            size="sm"
                            variant="noShadow"
                          >
                            {copied === 'key' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-none">
                      <p className="text-xs text-blue-900 dark:text-blue-100">
                        💡 Recipients will see read-only content and need to sign in to save progress.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => {
                          setShareData(null)
                          setError(null)
                        }}
                        variant="neutral"
                        className="flex-1 font-semibold"
                      >
                        Generate Another
                      </Button>
                      <Button
                        onClick={handleClose}
                        className="flex-1 font-semibold"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
