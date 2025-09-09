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
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription, selectTokenUsage, selectSubscriptionData } from "@/store/slices/subscription-slice"
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
  const dispatch = useAppDispatch()
  
  // Use Redux selectors directly for more reliable data
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const tokenUsage = useAppSelector(selectTokenUsage)
  const syncedOnceRef = useRef(false)

  useEffect(() => {
    if (syncedOnceRef.current) return
    syncedOnceRef.current = true
    const run = async () => {
      try {
        if (!progressApi?.isStarted?.()) progressApi?.start?.()
        // Force refresh to get latest data from database
        await dispatch(fetchSubscription({ forceRefresh: true })).unwrap()
        
        // Also refresh user data to ensure credits are up to date
        if (isAuthenticated && refreshUserData) {
          await refreshUserData()
        }
      } finally {
        progressApi?.done?.()
      }
    }
    run()
  }, [dispatch, isAuthenticated, refreshUserData])

  // Get token data directly from Redux store - prioritize subscription data over user session
  const totalTokens = subscriptionData?.credits || user?.credits || 0
  const tokensUsed = subscriptionData?.tokensUsed || user?.creditsUsed || 0
  const subscriptionPlan = subscriptionData?.subscriptionPlan || "FREE"

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
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Credits calculation MainNavbar:', {
        totalTokens,
        userCredits: user?.credits,
        userCreditsUsed: user?.creditsUsed,
        subscriptionCredits: subscriptionData?.credits,
        subscriptionTokensUsed: subscriptionData?.tokensUsed,
        credits,
        tokensUsed: used,
        availableCredits: available,
        subscriptionData,
        tokenUsage,
        subscriptionPlan
      })
    }
    
    return available
  }, [totalTokens, tokensUsed, user?.credits, user?.creditsUsed, subscriptionData, tokenUsage, subscriptionPlan])

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
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border/40",
          isScrolled
            ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/5"
            : "bg-background/80 backdrop-blur-lg",
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
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
          <div className="flex items-center space-x-3">
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
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80 p-0 bg-background">
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
                            "block px-3 py-2 rounded-lg",
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
                          <span className="text-sm font-medium tabular-nums">
                            {availableCredits.toLocaleString()}
                          </span>
                          {subscriptionPlan !== "FREE" && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {subscriptionPlan}
                            </Badge>
                          )}
                        </div>
                      )
                    ) : (
                      <Button className="w-full" onClick={handleSignIn}>
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
