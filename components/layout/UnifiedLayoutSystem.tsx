/**
 * Unified Layout Management System
 * 
 * This file provides a comprehensive overview of the layout restructuring
 * to implement proper Next.js layout management with better UX and no scrollbars.
 * 
 * CURRENT LAYOUT ISSUES:
 * 1. Multiple layout components with inconsistent patterns
 * 2. Fixed height containers causing scrollbar issues
 * 3. Lack of proper Next.js layout hierarchy
 * 4. Inconsistent spacing and overflow handling
 * 5. Complex layout logic scattered across components
 * 
 * UNIFIED SOLUTION:
 * 1. Create a proper layout hierarchy using Next.js layout system
 * 2. Implement consistent flex-based layouts without fixed heights
 * 3. Unified spacing system using Tailwind utilities
 * 4. Remove scrollbars through proper overflow management
 * 5. Responsive design patterns across all layouts
 */

import type { ReactNode } from 'react'

// === LAYOUT TYPES ===

export interface BaseLayoutProps {
  children: ReactNode
  className?: string
}

export interface DashboardLayoutProps extends BaseLayoutProps {
  sidebar?: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

export interface QuizLayoutProps extends BaseLayoutProps {
  quizType?: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard'
  sidebar?: ReactNode
  showProgress?: boolean
}

export interface CourseLayoutProps extends BaseLayoutProps {
  course?: any
  navigation?: ReactNode
  theatreMode?: boolean
}

// === LAYOUT COMPONENTS ===

/**
 * Base Layout Component
 * Provides fundamental layout structure for all pages
 */
export const BaseLayout = ({ children, className }: BaseLayoutProps) => {
  return (
    <div className={`min-h-0 flex flex-col ${className || ''}`}>
      {children}
    </div>
  )
}

/**
 * Main Content Container
 * Unified content wrapper with consistent spacing
 */
export const ContentContainer = ({ 
  children, 
  className,
  maxWidth = 'max-w-7xl',
  spacing = 'p-4 sm:p-6 lg:p-8'
}: BaseLayoutProps & {
  maxWidth?: string
  spacing?: string
}) => {
  return (
    <div className={`mx-auto w-full ${maxWidth} ${spacing} ${className || ''}`}>
      {children}
    </div>
  )
}

/**
 * Flex Layout Container
 * For layouts that need flexible height management
 */
export const FlexLayout = ({ 
  children, 
  className,
  direction = 'flex-col',
  gap = 'gap-6'
}: BaseLayoutProps & {
  direction?: string
  gap?: string
}) => {
  return (
    <div className={`flex ${direction} ${gap} flex-1 min-h-0 ${className || ''}`}>
      {children}
    </div>
  )
}

/**
 * Sidebar Layout
 * Unified sidebar implementation
 */
export const SidebarLayout = ({
  children,
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 'w-64',
  className
}: DashboardLayoutProps & {
  sidebarPosition?: 'left' | 'right'
  sidebarWidth?: string
}) => {
  return (
    <div className={`flex flex-1 min-h-0 ${className || ''}`}>
      {sidebarPosition === 'left' && sidebar && (
        <aside className={`shrink-0 ${sidebarWidth} border-r border-border/20`}>
          {sidebar}
        </aside>
      )}
      
      <main className="flex-1 min-w-0">
        {children}
      </main>
      
      {sidebarPosition === 'right' && sidebar && (
        <aside className={`shrink-0 ${sidebarWidth} border-l border-border/20`}>
          {sidebar}
        </aside>
      )}
    </div>
  )
}

// === LAYOUT UTILITIES ===

/**
 * Responsive Breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

/**
 * Layout Spacing System
 */
export const spacing = {
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
} as const

/**
 * Max Width Containers
 */
export const containers = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none'
} as const

/**
 * Common Layout Patterns
 */
export const layoutPatterns = {
  // Full height without scrollbars
  fullHeight: 'h-screen flex flex-col overflow-hidden',
  
  // Responsive container
  container: 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
  
  // Flex layouts
  flexCol: 'flex flex-col flex-1 min-h-0',
  flexRow: 'flex flex-row flex-1 min-w-0',
  
  // Spacing
  sectionSpacing: 'space-y-6 lg:space-y-8',
  itemSpacing: 'space-y-4',
  
  // Overflow handling
  autoScroll: 'overflow-auto',
  hiddenScroll: 'overflow-hidden',
  customScroll: 'overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
} as const

export default {
  BaseLayout,
  ContentContainer,
  FlexLayout,
  SidebarLayout,
  breakpoints,
  spacing,
  containers,
  layoutPatterns
}
