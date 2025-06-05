"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Search } from "lucide-react"
import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"

import MobileMenu from "@/components/layout/navigation/MobileMenu"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import useSubscription from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/useAuth"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { user, isAuthenticated, status: authStatus } = useAuth()
  const { totalTokens, tokenUsage, subscriptionPlan, isLoading: isSubscriptionLoading } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Improved authentication status handling
  const [authLoading, setAuthLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuTransition, setMenuTransition] = useState(false)

  // Sync authentication states
  useEffect(() => {
    if (sessionStatus !== "loading" && authStatus !== "loading") {
      setAuthLoading(false)
      setIsLoggedIn(sessionStatus === "authenticated" || isAuthenticated)
      
      // Add slight delay before showing menus for smooth transition
      setTimeout(() => setMenuTransition(true), 150)
    }
  }, [sessionStatus, authStatus, isAuthenticated])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle initial loading state
  useEffect(() => {
    if (!authLoading && !isSubscriptionLoading) {
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [authLoading, isSubscriptionLoading])

  // Calculate credits with proper fallbacks
  const credits = totalTokens ?? user?.credits ?? 0
  const availableCredits = credits - (tokenUsage ?? 0)
  const showLoading = isLoading && (authLoading || isSubscriptionLoading)
  
  // Get user display information with fallbacks
  const userImage = session?.user?.image || user?.image || ""
  const userName = session?.user?.name || user?.name || ""
  const userInitial = userName ? userName.charAt(0) : "U"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled ? "bg-background/95 shadow-sm" : "bg-background/80"
      } backdrop-blur-sm border-b transition-all duration-300`}
      data-testid="main-navbar"
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Logo />

        {/* Navigation links */}
        <nav className="mx-6 hidden items-center space-x-8 md:flex" data-testid="nav-items">
          {navItems.map((item) => (
            <Link href={item.href} key={item.name} data-testid={`nav-item-${item.name.toLowerCase()}`}>
              <div
                className={`relative py-2 text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-primary font-semibold" : "text-foreground hover:text-primary/80"
                }`}
              >
                {item.name}
                {pathname === item.href && <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />}
              </div>
            </Link>
          ))}
        </nav>

        <div className="flex items-center ml-auto space-x-4">
          {/* Credit display for authenticated users */}
          {isLoggedIn && !showLoading && (
            <div className="hidden md:flex items-center space-x-1" data-testid="credits-display">
              <div className="text-sm font-medium">Credits: {availableCredits.toLocaleString()}</div>
              {subscriptionPlan && subscriptionPlan !== "FREE" && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{subscriptionPlan}</span>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {showLoading && (
            <div className="hidden md:flex items-center" data-testid="loading-indicator">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          )}

          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchModalOpen(true)}
            className="relative h-8 w-8 rounded-full"
            aria-label="Search"
            data-testid="search-button"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Search Modal */}
          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={(url) => {
              router.push(url)
              setIsSearchModalOpen(false)
            }}
          />

          <ThemeToggle />
          
          {/* Notification Menu - Only show when authenticated */}
          {isLoggedIn && (
            <div className={`transition-opacity duration-200 ${menuTransition ? 'opacity-100' : 'opacity-0'}`}>
              <NotificationsMenu />
            </div>
          )}

          {/* User Menu */}
          <div className={`transition-all duration-300 ${!authLoading && menuTransition ? 'scale-100 opacity-100' : 'scale-95 opacity-90'}`}>
            <UserMenu>
              {isLoggedIn ? (
                // User is logged in - show avatar/profile
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8 border border-border/50 hover:border-primary/30 transition-all">
                    <AvatarImage src={userImage} />
                    <AvatarFallback className="bg-primary/5 text-primary">{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              ) : authLoading ? (
                // Auth is loading - show skeleton
                <div className="animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : (
                // User is not logged in - show sign in button
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push("/api/auth/signin")}
                  className="hover:bg-primary/5 transition-colors"
                >
                  Sign In
                </Button>
              )}
            </UserMenu>
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
