"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Loader2, Sparkles, Zap, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"

import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { useAuth } from "@/modules/auth"
import { cn } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { CreditCounter } from "@/components/shared/CreditCounter"

const SearchModal = lazy(() => import("@/components/layout/navigation/SearchModal"))
const NotificationsMenu = lazy(() => import("@/components/Navbar/NotificationsMenu"))

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  
  const {
    user,
    isAuthenticated,
    credits,
    tokensUsed,
    remainingCredits,
    plan,
    isLoading,
  } = useAuth()

  const totalTokens = credits || 0
  const subscriptionPlan = plan || "FREE"
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MainNavbar] Auth state changed:', {
        credits: totalTokens,
        used: tokensUsed,
        remaining: remainingCredits,
        plan: subscriptionPlan,
        isAuthenticated,
      })
    }
  }, [isAuthenticated, subscriptionPlan])

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHoveringLogo, setIsHoveringLogo] = useState(false)
  const [showCreditPulse, setShowCreditPulse] = useState(false)

  // Parallax effect for navbar
  const scrollY = useMotionValue(0)
  const navOpacity = useTransform(scrollY, [0, 100], [1, 0.98])
  const navScale = useTransform(scrollY, [0, 100], [1, 0.99])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scroll = window.scrollY
          scrollY.set(scroll)
          setIsScrolled(scroll > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrollY])

  const availableCredits = remainingCredits ?? 0

  // Show pulse animation when credits are low
  useEffect(() => {
    if (availableCredits < 100 && availableCredits > 0) {
      setShowCreditPulse(true)
    } else {
      setShowCreditPulse(false)
    }
  }, [availableCredits])

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

  // Enhanced desktop nav with magnetic hover effect
  const desktopNavItems = useMemo(() => 
    navItems.map((item) => {
      const active = pathname === item.href
      return (
        <motion.div
          key={item.name}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Link
            href={item.href}
            className={cn(
              "relative px-4 lg:px-5 py-2.5 text-xs lg:text-sm font-black uppercase tracking-wider transition-all duration-200",
              "border-4 rounded-none group overflow-hidden",
              active 
                ? "border-[var(--color-border)] bg-[var(--color-primary)] text-white shadow-[4px_4px_0_var(--shadow-color)]" 
                : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--shadow-color)]"
            )}
          >
            <span className="relative z-10">{item.name}</span>
            {/* Animated underline */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-primary)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: active ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            {/* Hover glow effect */}
            {!active && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-10"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            )}
          </Link>
        </motion.div>
      )
    }),
    [pathname]
  )

  // Enhanced mobile nav
  const mobileNavItems = useMemo(() =>
    navItems.map((item, index) => {
      const active = pathname === item.href
      return (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
        >
          <Link
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "block px-5 py-4 min-h-[56px] flex items-center font-black uppercase tracking-wider border-4 rounded-none",
              "transition-all duration-200 group relative overflow-hidden",
              active 
                ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)]" 
                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--shadow-color)]"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {item.name}
              {active && <ArrowRight className="h-4 w-4" />}
            </span>
            {/* Progress bar for active item */}
            {active && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}
          </Link>
        </motion.div>
      )
    }),
    [pathname]
  )

  return (
    <>
      <motion.header
        style={{ opacity: navOpacity, scale: navScale }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60]",
          "bg-[var(--color-bg)]/95 backdrop-blur-xl border-b-4 border-[var(--color-border)]",
          "transition-all duration-300 neo-typography-body",
          isScrolled && "shadow-[0_8px_16px_-4px_var(--shadow-color)]"
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.4
        }}
      >
        {/* Promotional banner for free users */}
        <AnimatePresence>
          {!isAuthenticated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] border-b-2 border-[var(--color-border)] overflow-hidden"
            >
              <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-white">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                  Sign up now and get <span className="text-[var(--color-warning)]">100 FREE credits</span>!
                </span>
                <TrendingUp className="h-4 w-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container flex h-16 items-center justify-between px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Logo with enhanced interactions */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link 
              href="/" 
              aria-label="Home"
              className="block relative"
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <motion.div
                animate={{ 
                  rotate: isHoveringLogo ? [-2, 2, -2, 2, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <Logo />
              </motion.div>
              {/* Glow effect on hover */}
              <AnimatePresence>
                {isHoveringLogo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.3, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-[var(--color-primary)] blur-xl -z-10 rounded-full"
                  />
                )}
              </AnimatePresence>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {desktopNavItems}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Enhanced credit counter with urgency indicators */}
            {isAuthenticated && !isLoading && (
              <motion.div 
                className="hidden sm:flex items-center gap-1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative">
                  <CreditCounter />
                  {/* Low credit warning pulse */}
                  {showCreditPulse && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="h-3 w-3 bg-[var(--color-warning)] border-2 border-[var(--color-border)] rounded-full shadow-[2px_2px_0_var(--shadow-color)]" />
                    </motion.div>
                  )}
                </div>
                {availableCredits < 100 && availableCredits > 0 && (
                  <motion.div
                    animate={{ 
                      y: [0, -2, 0],
                      rotate: [0, 10, -10, 0] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Enhanced Search Button */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.92, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                onClick={() => setIsSearchModalOpen(true)}
                className="h-9 w-9 sm:h-10 sm:w-10 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150 group"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-200" />
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              className="hidden sm:block"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <ThemeToggle />
            </motion.div>

            {/* Auth Section with enhanced CTAs */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1.5">
                <Suspense fallback={
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-5 w-5" />
                  </motion.div>
                }>
                  <NotificationsMenu />
                </Suspense>
                <UserMenu />
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleSignIn}
                  className={cn(
                    "hidden sm:flex items-center gap-2 font-black uppercase tracking-wider",
                    "min-h-[40px] px-4 lg:px-6 text-xs lg:text-sm",
                    "border-4 border-[var(--color-border)] bg-[var(--color-primary)] text-white",
                    "shadow-[3px_3px_0_var(--shadow-color)]",
                    "hover:shadow-[5px_5px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                    "active:shadow-[1px_1px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px]",
                    "transition-all duration-150 rounded-none relative overflow-hidden group"
                  )}
                  size="sm"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Sign in
                    <Zap className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </span>
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </motion.div>
            )}

            {/* Enhanced Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild suppressHydrationWarning>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden h-9 w-9 border-3 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-[1px_1px_0_var(--shadow-color)] transition-all duration-150"
                    suppressHydrationWarning
                    aria-label="Toggle menu"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={isMobileMenuOpen ? "close" : "open"}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[85vw] max-w-sm p-0 bg-[var(--color-bg)] border-r-4 border-[var(--color-border)] shadow-[8px_0px_0px_0px_var(--shadow-color)] rounded-none"
              >
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <motion.div 
                    className="p-4 border-b-4 border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Logo />
                    <ThemeToggle />
                  </motion.div>
                  
                  {/* Navigation with stagger animation */}
                  <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {mobileNavItems}
                  </nav>
                  
                  {/* Footer */}
                  <motion.div 
                    className="p-4 border-t-4 border-[var(--color-border)] space-y-3 bg-[var(--color-bg)]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isAuthenticated ? (
                      <>
                        {availableCredits !== null && (
                          <motion.div 
                            className="flex items-center justify-between p-4 bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-none shadow-[3px_3px_0_var(--shadow-color)] relative overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            {/* Animated background gradient */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="flex items-center space-x-2 relative z-10">
                              <CreditCard className="h-5 w-5" />
                              <span className="text-sm font-black uppercase">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2 relative z-10">
                              <span className="text-lg font-black tabular-nums">
                                {availableCredits.toLocaleString()}
                              </span>
                              {subscriptionPlan !== "FREE" && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1 border-2 border-[var(--color-border)] font-black shadow-[2px_2px_0_var(--shadow-color)] rounded-none uppercase"
                                >
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                        <div className="flex gap-2 md:hidden">
                          <Suspense fallback={
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5" />
                            </motion.div>
                          }>
                            <NotificationsMenu />
                          </Suspense>
                        </div>
                      </>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className={cn(
                            "w-full min-h-[56px] font-black uppercase tracking-wider",
                            "border-4 border-[var(--color-border)] bg-[var(--color-primary)] text-white",
                            "shadow-[4px_4px_0_var(--shadow-color)]",
                            "hover:shadow-[6px_6px_0_var(--shadow-color)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                            "active:shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px]",
                            "transition-all duration-150 rounded-none relative overflow-hidden group"
                          )}
                          onClick={() => {
                            handleSignIn()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            Get Started Free
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                          {/* Shine effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <Suspense fallback={null}>
        <SearchModal
          isOpen={isSearchModalOpen}
          setIsOpen={setIsSearchModalOpen}
          onResultClick={handleSearchResult}
        />
      </Suspense>
    </>
  )
}