"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { safeResetQuiz } from "@/store/slices/quiz-slice"

/**
 * Component that monitors navigation between quiz pages and ensures
 * state is reset when navigating between different quiz results
 */
export default function NavigationCleanup() {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const lastPathRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Skip initial render
    if (!lastPathRef.current) {
      lastPathRef.current = pathname
      return
    }
    
    const lastPath = lastPathRef.current
    
    // If we're navigating from one quiz result to another, clear storage and state
    if (lastPath.includes('/results') && pathname.includes('/results') && lastPath !== pathname) {
      console.log('Navigating between quiz results, clearing state')
      
      clearQuizStorageData()
      dispatch(safeResetQuiz())
    }
    
    // Update the ref
    lastPathRef.current = pathname
  }, [pathname, dispatch])
  
  const clearQuizStorageData = () => {
    try {
      // Clear localStorage
      localStorage.removeItem("quiz_state")
      localStorage.removeItem("pendingQuizResults")
      localStorage.removeItem("quizAuthTimestamp")
      localStorage.removeItem("quiz_answers_backup")
      
      // Clear sessionStorage
      sessionStorage.removeItem("pendingQuizState")
      sessionStorage.removeItem("pendingQuizResults")
      sessionStorage.removeItem("quiz_answers_backup")
      sessionStorage.removeItem("pendingQuiz")
      
      // Clear items with quiz_ prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('quiz_')) {
          localStorage.removeItem(key)
        }
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('quiz_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("Error clearing quiz storage:", error)
    }
  }
  
  // This component doesn't render anything
  return null
}
