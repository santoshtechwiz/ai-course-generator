"use client"

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X, CreditCard, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { useAuth } from "@/modules/auth"
import { cn, getColorClasses } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { CreditCounter } from "@/components/shared/CreditCounter"

// ⚡ PERFORMANCE: Lazy load heavy components to reduce initial bundle
const SearchModal = lazy(() => import("@/components/layout/navigation/SearchModal"))
const NotificationsMenu = lazy(() => import("@/components/Navbar/NotificationsMenu"))
const CourseNotificationsMenu = lazy(() => import("@/components/Navbar/CourseNotificationsMenu"))

export function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, isAuthenticated, credits, tokensUsed, remainingCredits, plan, isLoading } = useAuth()

  const totalTokens = credits || 0
  const subscriptionPlan = plan || "FREE"

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[MainNavbar] Auth state changed:", {
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
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const availableCredits = remainingCredits ?? 0

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

  const { buttonPrimary, buttonIcon, badgeCount } = getColorClasses()

  const desktopNavItems = useMemo(
    () =>
      navItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-black transition-all duration-150",
              "border-3 sm:border-4 border-transparent rounded-none transform",
              "hover:scale-105 active:scale-95 active:translate-y-1",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]",
              active
                ? "border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-text)] shadow-[var(--shadow-neo)]"
                : "hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--color-border)]",
            )}
          >
            {item.name}
            {active && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-current"
                layoutId="navbar-indicator"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        )
      }),
    [pathname],
  )

  const mobileNavItems = useMemo(
    () =>
      navItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "block px-4 py-3 min-h-[48px] flex items-center font-black border-4 rounded-none",
              "transition-all duration-150 active:scale-95 active:translate-y-1",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]",
              active
                ? "bg-[var(--color-primary)] text-[var(--color-text)] border-[var(--color-border)] shadow-[var(--shadow-neo)]"
                : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:shadow-[3px_3px_0_var(--color-border)]",
            )}
          >
            {item.name}
          </Link>
        )
      }),
    [pathname],
  )

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-[var(--z-index-fixed)]",
          "bg-[var(--color-bg)] border-b-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]",
          "transition-all duration-200",
        )}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          duration: 0.3,
        }}
      >
        <div className="container flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto gap-2 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex-shrink-0"
          >
            <Link
              href="/"
              aria-label="Home"
              className="block"
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <motion.div animate={{ rotate: isHoveringLogo ? [-1, 1, -1, 1, 0] : 0 }} transition={{ duration: 0.5 }}>
                <Logo />
              </motion.div>
            </Link>
          </motion.div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">{desktopNavItems}</nav>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {isAuthenticated && !isLoading && (
              <motion.div
                className="hidden sm:flex"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <CreditCounter />
                {availableCredits < 100 && availableCredits > 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="ml-1"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--color-warning)]" />
                  </motion.div>
                )}
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                onClick={() => setIsSearchModalOpen(true)}
                className={cn(
                  buttonIcon,
                  "border-3 border-[var(--color-border)] hover:border-[var(--color-border)]",
                  "hover:shadow-[3px_3px_0px_0px_var(--color-border)] transition-all duration-150",
                  "bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                )}
              >
                <Search className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div className="hidden sm:block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ThemeToggle />
            </motion.div>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <Suspense
                  fallback={
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="h-5 w-5 text-[var(--color-muted)]" />
                    </motion.div>
                  }
                >
                  <CourseNotificationsMenu />
                  <NotificationsMenu />
                </Suspense>
                <UserMenu />
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="hidden sm:block"
              >
                <Button
                  onClick={handleSignIn}
                  className={cn(
                    "font-black text-xs sm:text-sm",
                    buttonPrimary,
                    "min-h-[40px] border-4 shadow-[var(--shadow-neo)]",
                    "hover:shadow-[var(--shadow-neo-hover)] active:shadow-[var(--shadow-neo-active)]",
                    "active:translate-y-1 transition-all duration-150 rounded-none",
                  )}
                  size="sm"
                >
                  Sign in
                </Button>
              </motion.div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild suppressHydrationWarning>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "md:hidden",
                      buttonIcon,
                      "border-3 border-[var(--color-border)] hover:border-[var(--color-border)]",
                      "hover:shadow-[3px_3px_0px_0px_var(--color-border)] transition-all duration-150",
                      "bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                    )}
                    suppressHydrationWarning
                    aria-label="Toggle menu"
                  >
                    <motion.div animate={{ rotate: isMobileMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </motion.div>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] max-w-sm p-0 bg-[var(--color-bg)] border-r-4 border-[var(--color-border)] shadow-[4px_0px_0px_0px_var(--color-border)] z-[var(--z-index-modal)]"
                style={{
                  backdropFilter: "blur(8px)",
                }}
              >
                <motion.div
                  className="h-full flex flex-col"
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="p-3 sm:p-4 border-b-4 border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg)]">
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Logo />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <ThemeToggle />
                      </motion.div>
                    </div>
                  </div>

                  <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">{mobileNavItems}</nav>

                  <div className="p-3 sm:p-4 border-t-4 border-[var(--color-border)] space-y-3 bg-[var(--color-bg)]">
                    {isAuthenticated ? (
                      <>
                        {availableCredits !== null && (
                          <motion.div
                            className="flex items-center justify-between p-3 bg-[var(--color-bg)] border-3 border-[var(--color-border)] rounded-none shadow-[var(--shadow-neo)]"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span className="text-sm font-black">Credits</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-black tabular-nums">
                                {availableCredits.toLocaleString()}
                              </span>
                              {subscriptionPlan !== "FREE" && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 border-2 border-[var(--color-border)] font-black",
                                    "shadow-[2px_2px_0_var(--color-border)] rounded-none",
                                  )}
                                >
                                  {subscriptionPlan}
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        )}
                        <div className="flex gap-2 md:hidden">
                          <Suspense
                            fallback={
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <Loader2 className="h-5 w-5 text-[var(--color-muted)]" />
                              </motion.div>
                            }
                          >
                            <NotificationsMenu />
                          </Suspense>
                        </div>
                      </>
                    ) : (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className={cn(
                            "w-full min-h-[48px] font-black border-4 rounded-none",
                            buttonPrimary,
                            "shadow-[var(--shadow-neo)]",
                            "hover:shadow-[var(--shadow-neo-hover)]",
                            "active:shadow-[var(--shadow-neo-active)] active:translate-y-1",
                          )}
                          onClick={() => {
                            handleSignIn()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          Sign in
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      <Suspense fallback={null}>
        <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleSearchResult} />
      </Suspense>
    </>
  )
}
