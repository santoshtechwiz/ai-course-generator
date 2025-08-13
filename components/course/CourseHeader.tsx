'use client'

import { Menu, ArrowLeft, Star, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course, Video } from '@/hooks/useCourseData'

interface CourseHeaderProps {
  course: Course
  currentVideo: Video
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function CourseHeader({ 
  course, 
  currentVideo, 
  isSidebarOpen, 
  onToggleSidebar 
}: CourseHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Course Info */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900 truncate max-w-xs">
                {course.title}
              </h1>
              <p className="text-sm text-slate-600">
                by {course.instructor}
              </p>
            </div>
          </div>

          {/* Center Section - Current Video (Mobile) */}
          <div className="sm:hidden flex-1 text-center">
            <h2 className="text-sm font-medium text-slate-900 truncate">
              {currentVideo.title}
            </h2>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Course Stats */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{course.rating}</span>
                <span className="text-slate-400">({course.totalRatings})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>1.2k students</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration}</span>
              </div>
            </div>

            {/* Level Badge */}
            <div className="hidden sm:block">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                course.level === 'Beginner' && "bg-green-100 text-green-800",
                course.level === 'Intermediate' && "bg-yellow-100 text-yellow-800",
                course.level === 'Advanced' && "bg-red-100 text-red-800"
              )}>
                {course.level}
              </span>
            </div>

            {/* Subscribe Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}