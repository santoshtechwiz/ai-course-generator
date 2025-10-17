"use client"

import { usePathname } from "next/navigation"
import { MainNavbar } from "@/components/layout/navigation/MainNavbar"

/**
 * Conditional Navbar Component
 * Only shows MainNavbar on non-dashboard pages
 * 
 * Dashboard pages with sidebar navigation (hidden navbar):
 * - /dashboard/home
 * - /dashboard/courses
 * - /dashboard/my-quizzes
 * - /dashboard/explore
 * - /dashboard/account
 * - /dashboard/subscription
 */
export function ConditionalNavbar() {
  const pathname = usePathname()
  
  // List of dashboard routes that use sidebar navigation (no navbar needed)
  const sidebarRoutes = [
    '/dashboard/home',
    '/dashboard/courses',
    '/dashboard/my-quizzes',
    '/dashboard/explore',
    '/dashboard/account',
    '/dashboard/subscription',
    '/dashboard', // Main dashboard page
  ]
  
  // Hide navbar only on specific sidebar-enabled dashboard pages
  const shouldHideNavbar = sidebarRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + '/')
  )
  
  if (shouldHideNavbar) {
    return null
  }
  
  return <MainNavbar />
}
