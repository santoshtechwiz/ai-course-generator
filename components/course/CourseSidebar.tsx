'use client'

import { useState } from 'react'
import { Lock, Play, CheckCircle, Clock, Star, Users, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course, Video } from '@/hooks/useCourseData'

interface CourseSidebarProps {
  course: Course
  currentVideoIndex: number
  onVideoSelect: (index: number) => void
  canAccessVideo: (index: number) => boolean
  isSubscribed: boolean
}

export function CourseSidebar({ 
  course, 
  currentVideoIndex, 
  onVideoSelect, 
  canAccessVideo, 
  isSubscribed 
}: CourseSidebarProps) {
  const [activeTab, setActiveTab] = useState<'lessons' | 'summary'>('lessons')

  const completedVideos = isSubscribed ? course.videos.length : Math.min(2, course.videos.length)
  const progressPercentage = (completedVideos / course.videos.length) * 100

  return (
    <div className="space-y-6">
      {/* Course Summary Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{course.title}</h3>
            <p className="text-sm text-slate-600">by {course.instructor}</p>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{course.videos.length}</div>
            <div className="text-xs text-slate-600">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{course.duration}</div>
            <div className="text-xs text-slate-600">Duration</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < Math.floor(course.rating) 
                    ? "text-yellow-400 fill-current" 
                    : "text-slate-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-slate-600">
            {course.rating} ({course.totalRatings})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{completedVideos}/{course.videos.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex justify-center">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            course.level === 'Beginner' && "bg-green-100 text-green-800",
            course.level === 'Intermediate' && "bg-yellow-100 text-yellow-800",
            course.level === 'Advanced' && "bg-red-100 text-red-800"
          )}>
            {course.level}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('lessons')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'lessons'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'summary'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            Summary
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'lessons' ? (
            <div className="space-y-3">
              {course.videos.map((video, index) => {
                const isLocked = !canAccessVideo(index)
                const isCurrent = index === currentVideoIndex
                const isCompleted = index < completedVideos

                return (
                  <button
                    key={video.id}
                    onClick={() => onVideoSelect(index)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200 group",
                      isCurrent 
                        ? "bg-blue-50 border border-blue-200" 
                        : "hover:bg-slate-50 border border-transparent",
                      isLocked && "cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-16 h-12 rounded-lg bg-cover bg-center",
                          isLocked && "filter blur-sm"
                        )} style={{ backgroundImage: `url(${video.thumbnail})` }}>
                        </div>
                        
                        {/* Status Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isLocked ? (
                            <Lock className="w-5 h-5 text-slate-400" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Play className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            isCurrent ? "text-blue-700" : "text-slate-900",
                            isLocked && "text-slate-500"
                          )}>
                            {index + 1}. {video.title}
                          </h4>
                          {isLocked && (
                            <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{video.duration}</span>
                          </div>
                          {isLocked && (
                            <span className="text-blue-600 font-medium">Subscribe to unlock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">What you'll learn</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {course.description}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Course includes</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{course.videos.length} video lessons</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Interactive quizzes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Downloadable resources</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Certificate of completion</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscribe CTA for non-subscribers */}
      {!isSubscribed && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center">
          <h4 className="font-semibold mb-2">Unlock Full Access</h4>
          <p className="text-sm text-blue-100 mb-4">
            Get access to all {course.videos.length} lessons, quizzes, and resources
          </p>
          <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  )
}