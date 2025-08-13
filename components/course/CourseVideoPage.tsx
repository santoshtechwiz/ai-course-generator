'use client'

import { useState, useEffect } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { CourseSidebar } from './CourseSidebar'
import { VideoDescription } from './VideoDescription'
import { QuizSection } from './QuizSection'
import { ProgressTracker } from './ProgressTracker'
import { SubscribeButton } from './SubscribeButton'
import { RelatedCourses } from './RelatedCourses'
import { CourseHeader } from './CourseHeader'
import { useCourseData } from '@/hooks/useCourseData'
import { cn } from '@/lib/utils'

interface CourseVideoPageProps {
  courseId: string
}

export default function CourseVideoPage({ courseId }: CourseVideoPageProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  
  const { course, isLoading, error } = useCourseData(courseId)
  
  const isSubscribed = false // This would come from auth context
  const canAccessVideo = (index: number) => isSubscribed || index < 2
  
  const currentVideo = course?.videos[currentVideoIndex]
  const isVideoLocked = !canAccessVideo(currentVideoIndex)
  
  const handleVideoChange = (index: number) => {
    if (canAccessVideo(index)) {
      setCurrentVideoIndex(index)
    } else {
      setShowSubscribeModal(true)
    }
  }
  
  const handleNextVideo = () => {
    if (currentVideoIndex < course?.videos.length - 1) {
      handleVideoChange(currentVideoIndex + 1)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="aspect-video bg-slate-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-slate-200 rounded-lg"></div>
                <div className="h-32 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Course Not Found</h2>
          <p className="text-slate-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <CourseHeader 
        course={course}
        currentVideo={currentVideo}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            <div className="relative">
              <VideoPlayer 
                video={currentVideo}
                isLocked={isVideoLocked}
                onVideoEnd={handleNextVideo}
              />
              
              {/* Progress Tracker */}
              <div className="mt-6">
                <ProgressTracker 
                  currentIndex={currentVideoIndex}
                  totalVideos={course.videos.length}
                  completedVideos={isSubscribed ? course.videos.length : Math.min(2, course.videos.length)}
                />
              </div>
            </div>
            
            {/* Video Description */}
            <VideoDescription 
              video={currentVideo}
              isLocked={isVideoLocked}
            />
            
            {/* Quiz Section */}
            {currentVideoIndex >= 1 && (
              <QuizSection 
                quiz={course.quizzes[currentVideoIndex]}
                isLocked={!canAccessVideo(currentVideoIndex)}
                onComplete={() => {
                  // Handle quiz completion
                }}
              />
            )}
            
            {/* Next Lesson Button */}
            {currentVideoIndex < course.videos.length - 1 && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleNextVideo}
                  disabled={!canAccessVideo(currentVideoIndex + 1)}
                  className={cn(
                    "px-8 py-4 rounded-lg font-semibold transition-all duration-200",
                    canAccessVideo(currentVideoIndex + 1)
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {canAccessVideo(currentVideoIndex + 1) 
                    ? "Next Lesson" 
                    : "Subscribe to Continue"
                  }
                </button>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className={cn(
            "lg:block",
            isSidebarOpen ? "block" : "hidden"
          )}>
            <CourseSidebar 
              course={course}
              currentVideoIndex={currentVideoIndex}
              onVideoSelect={handleVideoChange}
              canAccessVideo={canAccessVideo}
              isSubscribed={isSubscribed}
            />
          </div>
        </div>
        
        {/* Related Courses */}
        <div className="mt-16">
          <RelatedCourses 
            currentCourseId={courseId}
            category={course.category}
          />
        </div>
      </div>
      
      {/* Floating Subscribe Button */}
      {!isSubscribed && (
        <SubscribeButton 
          isVisible={true}
          onClick={() => setShowSubscribeModal(true)}
        />
      )}
      
      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Unlock Full Course Access</h3>
            <p className="text-slate-600 mb-6">
              Subscribe to access all videos, quizzes, and course materials.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle subscription
                  setShowSubscribeModal(false)
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}