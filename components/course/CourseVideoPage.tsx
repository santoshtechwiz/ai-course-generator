'use client'

import { useState } from 'react'
import { CourseSidebar } from './CourseSidebar'
import { VideoDescription } from './VideoDescription'
import { QuizSection } from './QuizSection'
import { ProgressTracker } from './ProgressTracker'
import { SubscribeButton } from './SubscribeButton'
import { RelatedCourses } from './RelatedCourses'
import { CourseHeader } from './CourseHeader'
import { cn } from '@/lib/utils'

interface CourseVideoPageProps {
  courseId: string
}

export default function CourseVideoPage({ courseId }: CourseVideoPageProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  
  // Mock data - in real app this would come from API
  const course = {
    id: courseId,
    title: "Course Title",
    description: "Course description",
    instructor: "Instructor Name",
    category: "Category",
    level: "Beginner" as const,
    rating: 4.5,
    totalRatings: 100,
    duration: "10 hours",
    videos: [
      { id: "1", title: "Video 1", description: "Description 1", duration: "10:00" },
      { id: "2", title: "Video 2", description: "Description 2", duration: "15:00" },
      { id: "3", title: "Video 3", description: "Description 3", duration: "20:00" }
    ],
    quizzes: [
      { id: "quiz-1", title: "Quiz 1", questions: [] },
      { id: "quiz-2", title: "Quiz 2", questions: [] }
    ],
    thumbnail: "",
    tags: []
  }
  
  const isSubscribed = false // This would come from auth context
  const canAccessVideo = (index: number) => isSubscribed || index < 2
  
  const currentVideo = course.videos[currentVideoIndex]
  const isVideoLocked = !canAccessVideo(currentVideoIndex)
  
  const handleVideoChange = (index: number) => {
    if (canAccessVideo(index)) {
      setCurrentVideoIndex(index)
    } else {
      setShowSubscribeModal(true)
    }
  }
  
  const handleNextVideo = () => {
    if (currentVideoIndex < course.videos.length - 1) {
      handleVideoChange(currentVideoIndex + 1)
    }
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
            {/* Video Player Placeholder */}
            <div className="relative">
              <div className="aspect-video bg-slate-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎥</div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    {currentVideo.title}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {isVideoLocked ? "Subscribe to watch this video" : "Video player would go here"}
                  </p>
                  {isVideoLocked && (
                    <button 
                      onClick={() => setShowSubscribeModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Subscribe to Watch
                    </button>
                  )}
                </div>
              </div>
              
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