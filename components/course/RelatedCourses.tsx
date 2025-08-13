'use client'

import { Star, Clock, Users, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatedCourse {
  id: string
  title: string
  instructor: string
  thumbnail: string
  rating: number
  totalRatings: number
  duration: string
  level: string
  price: string
  isFree: boolean
}

interface RelatedCoursesProps {
  currentCourseId: string
  category: string
}

export function RelatedCourses({ currentCourseId, category }: RelatedCoursesProps) {
  // Mock related courses data
  const relatedCourses: RelatedCourse[] = [
    {
      id: 'ml-basics',
      title: 'Machine Learning Fundamentals',
      instructor: 'Dr. Alex Johnson',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.7,
      totalRatings: 892,
      duration: '8 hours',
      level: 'Intermediate',
      price: '$49',
      isFree: false
    },
    {
      id: 'deep-learning',
      title: 'Deep Learning with Python',
      instructor: 'Prof. Maria Rodriguez',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.9,
      totalRatings: 1243,
      duration: '15 hours',
      level: 'Advanced',
      price: '$79',
      isFree: false
    },
    {
      id: 'nlp-intro',
      title: 'Natural Language Processing',
      instructor: 'Dr. Sarah Chen',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.6,
      totalRatings: 567,
      duration: '10 hours',
      level: 'Intermediate',
      price: 'Free',
      isFree: true
    },
    {
      id: 'computer-vision',
      title: 'Computer Vision Essentials',
      instructor: 'Dr. Michael Brown',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.8,
      totalRatings: 734,
      duration: '12 hours',
      level: 'Intermediate',
      price: '$59',
      isFree: false
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Related Courses
        </h2>
        <p className="text-slate-600">
          Continue your learning journey with these recommended courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-200">
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${course.thumbnail})` }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Price Badge */}
              <div className="absolute top-3 right-3">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  course.isFree 
                    ? "bg-green-100 text-green-800" 
                    : "bg-blue-100 text-blue-800"
                )}>
                  {course.isFree ? 'Free' : course.price}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {course.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-3">
                by {course.instructor}
              </p>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < Math.floor(course.rating) 
                          ? "text-yellow-400 fill-current" 
                          : "text-slate-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600">
                  ({course.totalRatings})
                </span>
              </div>

              {/* Course Info */}
              <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{course.duration}</span>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  course.level === 'Beginner' && "bg-green-100 text-green-800",
                  course.level === 'Intermediate' && "bg-yellow-100 text-yellow-800",
                  course.level === 'Advanced' && "bg-red-100 text-red-800"
                )}>
                  {course.level}
                </span>
              </div>

              {/* Action Button */}
              <button className={cn(
                "w-full py-2 rounded-lg font-medium transition-colors",
                course.isFree
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}>
                {course.isFree ? 'Start Learning' : 'Enroll Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold">
          <span>View All Courses</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}