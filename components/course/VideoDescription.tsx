'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Tag, Clock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Video } from '@/hooks/useCourseData'

interface VideoDescriptionProps {
  video: Video
  isLocked: boolean
}

export function VideoDescription({ video, isLocked }: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {video.title}
          </h2>
          
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{video.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>Lesson {video.id}</span>
            </div>
          </div>
        </div>

        {/* Lock Badge */}
        {isLocked && (
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <span>Preview</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-4">
        <div className={cn(
          "prose prose-slate max-w-none",
          isLocked && "filter blur-sm pointer-events-none"
        )}>
          <p className="text-slate-700 leading-relaxed">
            {video.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Transcript Preview */}
        {!isLocked && (
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide Transcript</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show Transcript</span>
                </>
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Transcript</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {video.transcript}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Locked Content Notice */}
        {isLocked && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">🔒</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-1">
                  Subscribe to Access Full Content
                </h4>
                <p className="text-sm text-slate-600 mb-3">
                  This video is part of our premium content. Subscribe to unlock the full transcript, 
                  detailed notes, and access to all course materials.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}