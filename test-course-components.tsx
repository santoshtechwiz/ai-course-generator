import React from 'react'
import { CourseVideoPage } from './components/course'

// Simple test to verify components compile
export default function TestCourseComponents() {
  return (
    <div>
      <CourseVideoPage courseId="test-course" />
    </div>
  )
}