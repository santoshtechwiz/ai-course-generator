"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useSession } from 'next-auth/react'
import { progressApi } from "@/components/loaders/progress-api"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import { cn } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import type { User } from "@/types/auth"
import { CreditsDisplay } from "./CreditsDisplay"
import { UserAvatar } from "./UserAvatar"

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, refreshUserData } = useAuth()
  const { data: session, update: updateSession } = useSession()
  const { 
    subscription, 
    credits: sessionCredits,
    tokensUsed: sessionTokensUsed,
    plan: sessionPlan,
    refreshSubscription, 
    loading, 
    debugInfo 
  } = useUnifiedSubscription()
  
  const syncedOnceRef = useRef(false)

  useEffect(() => {
    if (syncedOnceRef.current) return
    syncedOnceRef.current = true
    const run = async () => {
      try {
        if (!progressApi?.isStarted?.()) progressApi?.start?.()
        // Force session refresh to get updated credits/plan from database
        if (isAuthenticated && updateSession) {
          await updateSession()
        }
        
        // Force refresh to get latest data from database
        await refreshSubscription()
        
        // Also refresh user data to ensure credits are up to date
        if (isAuthenticated && refreshUserData) {
          await refreshUserData()
        }
      } finally {
        progressApi?.done?.()
      }
    }
    run()
  }, [refreshSubscription, isAuthenticated, refreshUserData, updateSession])

  // Use session-authoritative data directly from unified hook
  const totalTokens = sessionCredits || 0
  const tokensUsed = sessionTokensUsed || 0  
  const subscriptionPlan = sessionPlan || "FREE"
  
  // Session sync is handled by useUnifiedSubscription; additional mismatch logging removed for production stability.
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[MainNavbar] Credit calculation:', {
      credits: totalTokens,
      used: tokensUsed,
      available: Math.max(0, totalTokens - tokensUsed),
      plan: subscriptionPlan,
      sessionRaw: {
        credits: user?.credits,
        creditsUsed: user?.creditsUsed,
        userType: user?.userType
      }
    })
  }

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const availableCredits = useMemo(() => {
    const credits = totalTokens
    const used = tokensUsed
    const available = Math.max(0, credits - used)
    
    // Credits are now session-authoritative, no sync issues expected
    if (process.env.NODE_ENV === 'development') {
      console.log('[MainNavbar] Credit calculation:', {
        credits: totalTokens,
        used: tokensUsed,
        available,
        plan: subscriptionPlan,
        sessionRaw: {
          credits: session?.user?.credits,
          creditsUsed: session?.user?.creditsUsed,
          userType: session?.user?.userType
        }
      })
    }
    
    return available
  }, [sessionCredits, sessionTokensUsed, sessionPlan, session?.user])

  const userInitials = useMemo(() => {
    const name = user?.name || ""
    return (
      name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }, [user?.name])

  const handleSignIn = useCallback(() => {
    router.push("/api/auth/signin")
  }, [router])

  const handleSearchResult = useCallback(
    (url: string) => {
      router.push(url)
      setIsSearchModalOpen(false)
    },
    [router],
  )

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50"
            : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg",
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-xl transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CreditsDisplay
              availableCredits={availableCredits}
              subscriptionPlan={subscriptionPlan}
              isPremium={subscriptionPlan !== "FREE"}
              prefersReducedMotion={false}
            />

            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setIsSearchModalOpen(true)}
              className="rounded-xl"
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <CourseNotificationsMenu />
                <NotificationsMenu />
                <UserMenu
                 
                />
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-xl">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0 bg-background">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <Logo />
                    <ThemeToggle />
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-3 py-2 rounded-lg min-h-[44px] flex items-center", // 44px touch target
                            active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                  <div className="p-4 border-t space-y-3">
                    {isAuthenticated ? (
                      availableCredits !== null && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Credits</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium tabular-nums">
                              {availableCredits.toLocaleString()}
                            </span>
                            {subscriptionPlan !== "FREE" && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                {subscriptionPlan}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <Button className="w-full min-h-[44px]" onClick={handleSignIn}>
                        Sign in
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <SearchModal
        isOpen={isSearchModalOpen}
        setIsOpen={setIsSearchModalOpen}
        onResultClick={handleSearchResult}
      />
    </>
  )
}
