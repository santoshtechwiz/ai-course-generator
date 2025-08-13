'use client'

import { useState } from 'react'
import { Heart, Share2, Bookmark, MessageCircle, ThumbsUp, ThumbsDown, Flag, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoEngagementProps {
  videoId: string
  videoTitle: string
  onLike?: () => void
  onShare?: () => void
  onBookmark?: () => void
  onComment?: () => void
  onDownload?: () => void
}

export function VideoEngagement({
  videoId,
  videoTitle,
  onLike,
  onShare,
  onBookmark,
  onComment,
  onDownload
}: VideoEngagementProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null)

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.()
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    onBookmark?.()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: videoTitle,
        text: `Check out this video: ${videoTitle}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
    }
    onShare?.()
  }

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackType(type)
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Engage with this video</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={cn(
            "flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200",
            isLiked 
              ? "bg-red-50 border border-red-200 text-red-600" 
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          )}
        >
          <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
          <span className="text-sm font-medium">
            {isLiked ? 'Liked' : 'Like'}
          </span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={cn(
            "flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200",
            isBookmarked 
              ? "bg-blue-50 border border-blue-200 text-blue-600" 
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          )}
        >
          <Bookmark className={cn("w-6 h-6", isBookmarked && "fill-current")} />
          <span className="text-sm font-medium">
            {isBookmarked ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <Share2 className="w-6 h-6" />
          <span className="text-sm font-medium">Share</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onComment}
          className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Comment</span>
        </button>
      </div>

      {/* Feedback Section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Was this video helpful?</h4>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleFeedback('positive')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">Yes</span>
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">No</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <Flag className="w-4 h-4" />
            <span className="text-sm font-medium">Report</span>
          </button>
        </div>
      </div>

      {/* Download Section */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={onDownload}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Download Resources</span>
        </button>
      </div>

      {/* Feedback Notification */}
      {showFeedback && (
        <div className="fixed top-4 right-4 z-50">
          <div className={cn(
            "px-4 py-2 rounded-lg text-white font-medium animate-in slide-in-from-right",
            feedbackType === 'positive' ? "bg-green-500" : "bg-red-500"
          )}>
            {feedbackType === 'positive' ? 'Thanks for your feedback!' : 'We\'ll work to improve this content.'}
          </div>
        </div>
      )}
    </div>
  )
}