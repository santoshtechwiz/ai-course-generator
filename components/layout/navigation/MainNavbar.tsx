"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Sparkles } from "lucide-react"
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
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"
import CourseNotificationsMenu from "@/components/Navbar/CourseNotificationsMenu"
import { cn } from "@/lib/utils"
import { AsyncNavLink } from "@/components/loaders/AsyncNavLink"
import { useGlobalLoader } from '@/store/loaders/global-loader'

import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion"
import Logo from "@/components/shared/Logo"


export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const subscription = useSubscription()
  const { startLoading } = useGlobalLoader()
  
  // Extract subscription details
  const totalTokens = user?.credits || 0
  const tokenUsage = 0 // TODO: Track token usage
  const subscriptionPlan = subscription?.subscription.plan || 'FREE'
  const isSubscriptionLoading = authLoading
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ready, setReady] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  // Keyboard shortcuts (Cmd/Ctrl+K, /)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable
      // Cmd/Ctrl+K opens search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchModalOpen(true)
        return
      }
      // / quick search if not typing
      if (!isTyping && e.key === '/') {
        e.preventDefault()
        setIsSearchModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      } 
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }
  
  const mobileMenuVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    exit: {
      x: "100%", 
      opacity: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }

  // Optimized scroll handler
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 6)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  // Ready state for smooth animations
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setReady(true), 100)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  // Memoized calculations
  const availableCredits = useMemo(() => {
    const credits = totalTokens ?? user?.credits ?? 0
    if (typeof credits === "number" && typeof tokenUsage === "number") {
      return Math.max(0, credits - tokenUsage)
    }
    return null
  }, [totalTokens, user?.credits, tokenUsage])
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
  const handleSearchOpen = useCallback(() => setIsSearchModalOpen(true), [])
  const handleSearchClose = useCallback(() => setIsSearchModalOpen(false), [])
  const handleMobileMenuToggle = useCallback(() => setIsMobileMenuOpen((prev) => !prev), [])
  const handleSignIn = useCallback(() => {
    startLoading({ message: "Loading...", minVisibleMs: 200, autoProgress: true });
    router.push("/api/auth/signin")
  }, [router, startLoading])

  const handleSearchResult = useCallback(
    (url: string) => {
      startLoading({ message: "Loading...", minVisibleMs: 200, autoProgress: true });
      router.push(url)
      handleSearchClose()
    },
    [router, handleSearchClose, startLoading],
  )

  // Desktop nav palette and animations
  const navigationItems = useMemo(
    () =>
      navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon || (() => null)
        
        return (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="relative"
          >
            <AsyncNavLink
              href={item.href}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors group block rounded-md whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "text-primary bg-primary/5 border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
              data-testid={`nav-item-${item.name.toLowerCase()}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isActive ? "bg-primary/10" : "group-hover:bg-accent/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </div>
                <span className="font-medium whitespace-nowrap">{item.name}</span>
              </div>
              {/* Active underline */}
              <motion.span
                layoutId={`nav-underline-${item.name}`}
                className={cn(
                  "absolute left-4 right-4 bottom-1 h-[2px] rounded-full",
                  isActive ? "bg-primary/70" : "bg-transparent group-hover:bg-primary/40"
                )}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </AsyncNavLink>
          </motion.div>
        )
      }),
    [pathname, itemVariants],
  )

  // Mobile navigation items with refined colors
  const mobileNavigationItems = useMemo(
    () => navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon || (() => null)
        
        return (
          <motion.div key={item.name} variants={itemVariants}>
            <AsyncNavLink
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-lg whitespace-nowrap",
                isActive
                  ? "text-primary bg-primary/5 border-l-2 border-primary"
                  : "text-foreground/80 hover:text-foreground/90 hover:bg-accent/70 border-l-2 border-transparent",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn("p-2 rounded-md", isActive ? "bg-primary/10" : "bg-muted/50")}> 
                <Icon className="w-4 h-4" />
              </div>
              {item.name}
            </AsyncNavLink>
          </motion.div>
        )
      }),
    [pathname, itemVariants, setIsMobileMenuOpen],
  )

  // Credits display component
  const CreditsDisplay = useMemo(() => {
    if (!isAuthenticated) return null

    if (availableCredits === null) {
      return (
        <div className="hidden lg:flex items-center space-x-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      )
    }

    const isLowCredits = availableCredits < 100
    const isPremium = subscriptionPlan && subscriptionPlan !== "FREE"

    return (
      <div className="hidden lg:flex items-center space-x-2" data-testid="credits-display">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-card/80 backdrop-blur border rounded-lg shadow-sm whitespace-nowrap">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span
            className={cn("text-sm font-medium tabular-nums", isLowCredits ? "text-destructive" : "text-foreground")}
          >
            <AnimatedNumber value={availableCredits} />
          </span>
        </div>
        {isPremium && (
          <Badge variant="secondary" className="text-xs font-medium">
            <Sparkles className="h-3 w-3 mr-1" />
            {subscriptionPlan}
          </Badge>
        )}
      </div>
    )
  }, [isAuthenticated, availableCredits, subscriptionPlan])

  const isPremium = useMemo(() => subscriptionPlan && subscriptionPlan !== "FREE", [subscriptionPlan])

  // User avatar component
  const UserAvatar = useMemo(
    () => (
      <Avatar className="h-8 w-8 border-2 border-border/50 hover:border-primary/50 transition-all duration-200">
        <AvatarImage src={(user as any)?.image || ""} alt={user?.name || "User"} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
      </Avatar>
    ),
    [(user as any)?.image, user?.name, userInitials],  )

  function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState<number>(value)
    useEffect(() => {
      if (typeof value !== "number") return
      const startValue = display
      const endValue = value
      if (startValue === endValue) return
      const durationMs = 500
      const startAt = performance.now()
      let raf = 0
      const step = (now: number) => {
        const t = Math.min(1, (now - startAt) / durationMs)
        const current = Math.round(startValue + (endValue - startValue) * t)
        setDisplay(current)
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, [value])
    return <>{Number.isFinite(display) ? display.toLocaleString() : "0"}</>
  }
  
  return (
    <>
      {/* Skip to content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:bg-background focus:border focus:rounded px-3 py-1 shadow">
        Skip to content
      </a>
      <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 ai-glass dark:ai-glass-dark",
          scrolled && "bg-background/85 shadow-sm"
        )}
        data-testid="main-navbar"
        role="navigation"
        aria-label="Main navigation"
      >
        <motion.div 
          className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl"
          initial="hidden"
          animate="visible"
          variants={navbarVariants}
        >
          {/* Logo */}
          <motion.div 
            className="flex items-center" 
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0.2 }}
            whileTap={{ scale: 0.98 }}
          >
            <AsyncNavLink href="/" aria-label="Return to homepage">
              <Logo />
            </AsyncNavLink>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav 
            className="hidden md:flex items-center space-x-3" 
            data-testid="nav-items"
            variants={itemVariants}
            aria-label="Primary navigation"
          >
            {navigationItems}
          </motion.nav>

          {/* Right section */}
          <motion.div className="hidden md:flex items-center gap-3" variants={itemVariants}>
            {CreditsDisplay}
            <Button variant="ghost" size="icon" aria-label="Open search" aria-expanded={isSearchModalOpen} onClick={handleSearchOpen}
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <CourseNotificationsMenu />
                <NotificationsMenu />
                <UserMenu>{UserAvatar}</UserMenu>
              </>
            ) : (
              <Button onClick={handleSignIn} className="bg-primary text-primary-foreground hover:bg-primary/90">Sign in</Button>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <motion.div className="md:hidden flex items-center gap-2" variants={itemVariants}>
            <Button variant="ghost" size="icon" onClick={handleSearchOpen} aria-label="Open search" aria-expanded={isSearchModalOpen}
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </Button>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" onClick={handleMobileMenuToggle}
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </SheetTrigger>
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <SheetContent side="right" className="w-80 p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-l border-border/60 ai-glass dark:ai-glass-dark">
                    <motion.div initial="hidden" animate="visible" exit="exit" variants={mobileMenuVariants} className="h-full flex flex-col">
                      <div className="p-4 border-b border-border/60">
                        <div className="flex items-center justify-between">
                          <Logo />
                          <ThemeToggle />
                        </div>
                      </div>
                      <nav className="flex-1 p-3 space-y-1">
                        {mobileNavigationItems}
                      </nav>
                      <div className="p-3 border-t border-border/60 flex items-center gap-2">
                        {isAuthenticated ? (
                          <UserMenu className="flex-1">
                            <Button variant="outline" className="w-full">Account</Button>
                          </UserMenu>
                        ) : (
                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSignIn}>Sign in</Button>
                        )}
                      </div>
                    </motion.div>
                  </SheetContent>
                )}
              </AnimatePresence>
            </Sheet>
          </motion.div>
        </motion.div>
      </header>

      </MotionConfig>

      <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
    </>
  )
}
