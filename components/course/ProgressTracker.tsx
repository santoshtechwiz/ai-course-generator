'use client'

import { CheckCircle, Circle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  currentIndex: number
  totalVideos: number
  completedVideos: number
}

export function ProgressTracker({ currentIndex, totalVideos, completedVideos }: ProgressTrackerProps) {
  const progressPercentage = (completedVideos / totalVideos) * 100

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">Course Progress</h3>
        <span className="text-sm text-slate-600">
          {completedVideos} of {totalVideos} completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalVideos }, (_, index) => {
          const isCompleted = index < completedVideos
          const isCurrent = index === currentIndex
          const isLocked = index >= 2 // First 2 videos are free

          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="relative">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : isLocked ? (
                  <div className="relative">
                    <Circle className="w-6 h-6 text-slate-300" />
                    <Lock className="w-3 h-3 text-slate-400 absolute inset-0 m-auto" />
                  </div>
                ) : (
                  <Circle className={cn(
                    "w-6 h-6",
                    isCurrent ? "text-blue-500 fill-current" : "text-slate-300"
                  )} />
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {index + 1}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress Stats */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-slate-900">{completedVideos}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{totalVideos - completedVideos}</div>
            <div className="text-xs text-slate-600">Remaining</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-slate-600">Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
}