"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Zap, Brain } from "lucide-react"
import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { useAuth, useSubscription } from "@/modules/auth"
import { useAppDispatch, useAppSelector } from "@/store"
import { forceSyncSubscription, selectIsSubscriptionFetching, selectTokenUsage } from "@/store/slices/subscription-slice"
import { progressApi } from "@/components/loaders/progress-api"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Logo from "@/components/shared/Logo"
import { throttle } from "@/utils/throttle"
import type { User } from "@/types/auth"
import { CreditsDisplay } from "./CreditsDisplay"
import { UserAvatar } from "./UserAvatar"

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const subscription = useSubscription()
  const dispatch = useAppDispatch()
  const subFetching = useAppSelector(selectIsSubscriptionFetching) as boolean
  const tokenUsage = useAppSelector(selectTokenUsage)
  const syncedOnceRef = useRef(false)

  // Force fresh subscription sync (Navbar always fresh) once per mount
  useEffect(() => {
    if (syncedOnceRef.current) return
    syncedOnceRef.current = true
    let active = true
    const run = async () => {
      try {
        if (!progressApi?.isStarted?.()) progressApi?.start?.()
        await dispatch(forceSyncSubscription()).unwrap()
      } catch (error) {
        // Log the error for debugging but don't crash the app
        console.warn('Subscription sync failed in MainNavbar, continuing with cached data:', error)
      } finally {
        if (active && progressApi?.done) progressApi.done()
      }
    }
    run()
    return () => { active = false }
  }, [dispatch])

  // Safe reduced motion check
  const prefersReducedMotion = useReducedMotion()

  // Extract subscription details with proper null checks
  const subscriptionData = subscription?.subscription
  const totalTokens = subscriptionData?.credits || 0
  const tokenUsageValue = tokenUsage?.tokensUsed || 0
  const subscriptionPlan = subscriptionData?.plan || "FREE"

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const tickingRef = useRef(false)

  // Enhanced mouse tracking with better performance - using ref to prevent re-renders
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!tickingRef.current) {
      tickingRef.current = true
      requestAnimationFrame(() => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY }
        tickingRef.current = false
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener("mousemove", handleMouseMove, { passive: true })
      return () => window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  // Enhanced scroll effect with better performance
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", handleScroll, { passive: true })
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Keyboard shortcuts - with error boundary
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      try {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        const isTyping = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable

        // Cmd/Ctrl+K opens search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault()
          setIsSearchModalOpen(true)
          return
        }

        // / quick search if not typing
        if (!isTyping && e.key === "/") {
          e.preventDefault()
          setIsSearchModalOpen(true)
        }

        // Escape closes modals
        if (e.key === "Escape") {
          setIsSearchModalOpen(false)
          setIsMobileMenuOpen(false)
        }
      } catch (error) {
        console.warn('Keyboard handler failed:', error)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener("keydown", onKeyDown)
      return () => window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  // Memoized calculations
  const availableCredits = useMemo(() => {
    const credits = totalTokens ?? user?.credits ?? 0
    if (typeof credits === "number" && typeof tokenUsageValue === "number") {
      return Math.max(0, credits - tokenUsageValue)
    }
    return null
  }, [totalTokens, user?.credits, tokenUsageValue])

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

  // Handlers
  const handleSearchOpen = useCallback(() => {
    setIsSearchModalOpen(true)
  }, [])

  const handleSearchClose = useCallback(() => {
    setIsSearchModalOpen(false)
  }, [])

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const handleSignIn = useCallback(() => {
    router.push("/api/auth/signin")
  }, [router])

  const handleSearchResult = useCallback(
    (url: string) => {
      router.push(url)
      handleSearchClose()
    },
    [router, handleSearchClose],
  )

  const isPremium = useMemo(() => {
    return subscriptionPlan && subscriptionPlan !== "FREE"
  }, [subscriptionPlan])

  // Enhanced AI-themed animation variants with fallbacks
  const navbarVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }

  const aiGlowVariants = {
    idle: {
      opacity: 0.6,
      scale: 1,
    },
    hover: {
      opacity: 1,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      x: "100%",
      scale: 0.95
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      },
    },
    exit: {
      opacity: 0,
      x: "100%",
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  }

  return (
    <>
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[1000] focus-visible:bg-background focus-visible:border focus-visible:rounded-lg px-4 py-2 shadow-lg font-medium"
      >
        Skip to content
      </a>

      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isScrolled
            ? "bg-background/95 backdrop-blur-xl shadow-2xl border-primary/20 shadow-primary/5"
            : "bg-background/80 backdrop-blur-lg border-border/40",
        )}
        data-testid="main-navbar"
        role="navigation"
        aria-label="Main navigation"
        initial={prefersReducedMotion ? {} : "hidden"}
        animate={prefersReducedMotion ? {} : "visible"}
        variants={prefersReducedMotion ? {} : navbarVariants}
        style={{
          background: isScrolled
            ? 'linear-gradient(135deg, hsl(var(--background)/0.95) 0%, hsl(var(--background)/0.98) 100%)'
            : 'linear-gradient(135deg, hsl(var(--background)/0.8) 0%, hsl(var(--background)/0.9) 100%)'
        }}
      >
        {/* AI Glow Effect */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePositionRef.current.x}px ${mousePositionRef.current.y}px, hsl(var(--primary)/0.1) 0%, transparent 50%)`,
            transition: 'opacity 0.3s ease'
          }}
        />

        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          
          {/* Logo */}
          <Link
            href="/"
            aria-label="Return to homepage"
            className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-lg"
          >
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-1"
            data-testid="nav-items"
            aria-label="Primary navigation"
          >
            {navItems.map((item, index) => {
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.name}
                  variants={prefersReducedMotion ? {} : itemVariants}
                  initial={prefersReducedMotion ? {} : "hidden"}
                  animate={prefersReducedMotion ? {} : "visible"}
                  transition={prefersReducedMotion ? {} : { delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                      "group overflow-hidden",
                      isActive
                        ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-lg shadow-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5",
                    )}
                    data-testid={`nav-item-${item.name.toLowerCase()}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* AI Glow Effect */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-xl"
                    )} />

                    {/* Active Indicator */}
                    {isActive && !prefersReducedMotion && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10">{item.name}</span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">

            {/* Credits Display */}
            <CreditsDisplay
              availableCredits={availableCredits}
              subscriptionPlan={subscriptionPlan}
              isPremium={Boolean(isPremium)}
              prefersReducedMotion={Boolean(prefersReducedMotion)}
            />

            {/* Search Button */}
            <motion.div
              variants={prefersReducedMotion ? {} : itemVariants}
              initial={prefersReducedMotion ? {} : "hidden"}
              animate={prefersReducedMotion ? {} : "visible"}
              transition={prefersReducedMotion ? {} : { delay: 0.3 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open search (Press / or Ctrl/Cmd+K)"
                title="Search — press / or Ctrl/Cmd+K"
                aria-expanded={isSearchModalOpen}
                onClick={handleSearchOpen}
                className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  "hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10",
                  "hover:shadow-lg hover:shadow-primary/10",
                  "border border-transparent hover:border-primary/20",
                  "group relative overflow-hidden"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Search className="h-4 w-4 relative z-10 group-hover:text-primary transition-colors" />
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              variants={prefersReducedMotion ? {} : itemVariants}
              initial={prefersReducedMotion ? {} : "hidden"}
              animate={prefersReducedMotion ? {} : "visible"}
              transition={prefersReducedMotion ? {} : { delay: 0.4 }}
            >
              <ThemeToggle />
            </motion.div>

            {/* Authentication Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <CourseNotificationsMenu />
                <NotificationsMenu />
                <UserMenu>
                  <UserAvatar
                    user={user}
                    userInitials={userInitials}
                    prefersReducedMotion={Boolean(prefersReducedMotion)}
                  />
                </UserMenu>
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                size="sm"
              >
                Sign in
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <motion.div
                  variants={prefersReducedMotion ? {} : itemVariants}
                  initial={prefersReducedMotion ? {} : "hidden"}
                  animate={prefersReducedMotion ? {} : "visible"}
                  transition={prefersReducedMotion ? {} : { delay: 0.5 }}
                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "md:hidden h-9 w-9 rounded-xl transition-all duration-300",
                      "hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10",
                      "hover:shadow-lg hover:shadow-primary/10",
                      "border border-transparent hover:border-primary/20",
                      "group relative overflow-hidden"
                    )}
                    aria-label="Open menu"
                    aria-controls="main-mobile-menu"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isMobileMenuOpen ? "close" : "open"}
                        initial={prefersReducedMotion ? {} : { rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={prefersReducedMotion ? {} : { rotate: 90, opacity: 0 }}
                        transition={prefersReducedMotion ? {} : { duration: 0.2 }}
                        className="relative z-10"
                      >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </SheetTrigger>

              <SheetContent
                id="main-mobile-menu"
                side="right"
                className="w-72 sm:w-80 p-0 bg-background border-l"
              >
                <motion.div
                  initial={prefersReducedMotion ? {} : "hidden"}
                  animate={prefersReducedMotion ? {} : "visible"}
                  exit={prefersReducedMotion ? {} : "exit"}
                  variants={prefersReducedMotion ? {} : mobileMenuVariants}
                  className="h-full flex flex-col"
                >
                  {/* Mobile Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <Logo />
                      <ThemeToggle />
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-3 py-2 text-base font-medium rounded-lg transition-colors",
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="p-4 border-t space-y-3">
                    {isAuthenticated ? (
                      <>
                        {availableCredits !== null && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium tabular-nums">
                                {availableCredits.toLocaleString()}
                              </span>
                              {isPremium && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                       
                      </>
                    ) : (
                      <Button className="w-full" onClick={handleSignIn}>
                        Sign in
                      </Button>
                    )}
                  </div>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        setIsOpen={setIsSearchModalOpen} 
        onResultClick={handleSearchResult} 
      />
    </>
  )
}