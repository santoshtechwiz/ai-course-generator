"use client"

import * as React from "react"
import { Search, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/toaster"
import { ReduxErrorBoundary } from "@/components/ui/error-boundary"
import Logo from "@/components/shared/Logo"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import Chatbot from "@/components/features/chat/Chatbot"
import CourseAIState from "@/components/development/CourseAIState"
import { useAuth } from "@/modules/auth"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
  userId?: string
  className?: string
}

/**
 * Consolidated Dashboard Layout Component
 *
 * Complete dashboard layout with integrated navbar and footer:
 * - Clean dashboard navbar with search, notifications, and user menu
 * - Main content area with error boundaries
 * - Footer with copyright and links
 * - Global components (Toaster, Chatbot, Dev Tools)
 * - Mobile responsive design
 */
export function DashboardLayout({
  children,
  userId,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Dashboard Navbar */}
      <DashboardNavbar />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4 py-6">
          <ReduxErrorBoundary>
            {children}
          </ReduxErrorBoundary>
        </div>
      </main>

      {/* Dashboard Footer */}
      <DashboardFooter />

      {/* Global Dashboard Components */}
      <Toaster />
      {userId && <Chatbot userId={userId} />}

      {/* Development Tools */}
      {process.env.NODE_ENV !== "production" && (
        <CourseAIState />
      )}
    </div>
  )
}

/**
 * Dashboard Navbar Component (Integrated)
 */
function DashboardNavbar({ className }: { className?: string }) {
  const { user, isAuthenticated } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>

        {/* Search - Centered on larger screens */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, quizzes..."
              className="pl-8 w-full"
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setIsSearchOpen(false)}
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <nav className="flex items-center space-x-2">
          {/* Mobile Search */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications */}
          {isAuthenticated && (
            <CourseNotificationsMenu />
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <UserMenu user={user} />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden fixed top-2 left-2 z-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <MobileNav />
        </SheetContent>
      </Sheet>
    </header>
  )
}

/**
 * Mobile Navigation Component
 */
function MobileNav() {
  return (
    <div className="flex flex-col space-y-4">
      <Link href="/dashboard" className="flex items-center">
        <Logo />
      </Link>
      <div className="flex flex-col space-y-3">
        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
        <Link href="/dashboard/courses" className="text-sm font-medium hover:text-primary transition-colors">
          Courses
        </Link>
        <Link href="/dashboard/quizzes" className="text-sm font-medium hover:text-primary transition-colors">
          Quizzes
        </Link>
        <Link href="/dashboard/create" className="text-sm font-medium hover:text-primary transition-colors">
          Create
        </Link>
      </div>
    </div>
  )
}

/**
 * User Menu Component
 */
interface UserMenuProps {
  user: any
}

function UserMenu({ user }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image} alt={user?.name} />
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/subscription" className="flex items-center">
            Subscription
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/auth/signout" className="flex items-center text-red-600">
            Sign Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Dashboard Footer Component (Integrated)
 */
function DashboardFooter({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn("border-t bg-background/95 backdrop-blur", className)}>
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>© {currentYear} CourseAI. All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <a
            href="/support"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </a>
          <a
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  )
}

export default DashboardLayout
