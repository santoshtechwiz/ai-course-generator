"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, Search } from "lucide-react"
import { motion } from "framer-motion"
import { navItems } from "@/constants/navItems"


import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"

import { useAuth } from "@/hooks/use-auth"
import MobileMenu from "@/components/layout/navigation/MobileMenu"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { useSession } from "next-auth/react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription, selectSubscription, selectTokenUsage } from "@/store/slices/subscription-slice"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"

// NavItems component with proper memoization
const NavItems = memo(() => {
  const [currentPath, setCurrentPath] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    setCurrentPath(pathname || "")
  }, [pathname])

  return (
    <nav className="mx-6 hidden items-center space-x-8 md:flex">
      {navItems.map((item) => (
        <Link href={item.href} passHref key={item.name}>
          <motion.div
            className={`relative py-2 text-sm font-medium transition-colors ${
              currentPath === item.href ? "text-primary font-semibold" : "text-foreground hover:text-primary/80"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {item.name}
            {currentPath === item.href && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
            {item.subItems && item.subItems.length > 0 && <ChevronDown className="inline h-3 w-3 ml-1" />}
          </motion.div>
        </Link>
      ))}
    </nav>
  )
})
NavItems.displayName = "NavItems"

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const dispatch = useAppDispatch()

  // Use Redux for auth and subscription
  const { user, isAuthenticated, isLoading: authLoading, signOutUser } = useAuth()
  const subscription = useAppSelector(selectSubscription)
  const tokenUsage = useAppSelector(selectTokenUsage)
  const isSubscriptionLoading = useAppSelector((state) => state.subscription.isLoading)

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const [creditScore, setCreditScore] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Extract user data from Redux auth state
  const isAdmin = user?.isAdmin || false
  const userName = user?.name || ""
  const userEmail = user?.email || ""

  // Scroll handler with proper debouncing
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  // Update pathname in useEffect
  useEffect(() => {
    setCurrentPath(pathname || "")
  }, [pathname])

  // Add scroll listener with cleanup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const debouncedScroll = debounce(handleScroll, 10)
      window.addEventListener("scroll", debouncedScroll, { passive: true })
      return () => window.removeEventListener("scroll", debouncedScroll)
    }
  }, [handleScroll])

  // Fetch subscription data when session changes
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.id) {
      dispatch(fetchSubscription())
    }
  }, [sessionStatus, session?.user?.id, dispatch])

  // Set initial load timeout
  useEffect(() => {
    if (!isAuthenticated) return

    const initialLoadTimer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 3000)

    return () => {
      clearTimeout(initialLoadTimer)
    }
  }, [isAuthenticated])

  // Update credit score from subscription data
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (subscription?.credits !== undefined) {
        setCreditScore(subscription.credits)
      } else if (user?.credits !== undefined) {
        setCreditScore(user.credits)
      }
    }, 100)

    return () => clearTimeout(debounceTimer)
  }, [subscription?.credits, user?.credits])

  // Handle search modal
  const handleSearchOpen = () => {
    setIsSearchModalOpen(true)
  }

  const handleResultClick = (url: string) => {
    router.push(url)
    setIsSearchModalOpen(false)
  }

  // Simple debounce function
  function debounce(fn: Function, ms = 300) {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
  }

  // Animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  }

  // Determine subscription plan from Redux state
  const subscriptionPlan = subscription?.subscriptionPlan || "FREE"
  const tokensUsed = subscription?.tokensUsed || 0
  const showLoading = isInitialLoad && isSubscriptionLoading && isAuthenticated

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled ? "bg-background/95 shadow-sm" : "bg-background/80"
      } backdrop-blur-sm border-b transition-all duration-300`}
      initial="hidden"
      animate="visible"
      variants={headerVariants}
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Logo />

        {/* Navigation links */}
        <NavItems />

        <div className="flex items-center ml-auto space-x-4">
          {/* Credit display for authenticated users */}
          {isAuthenticated && !showLoading && (
            <div className="hidden md:flex items-center space-x-1">
              <motion.div
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Credits: {creditScore - tokensUsed}
              </motion.div>
              {subscriptionPlan !== "FREE" && (
                <motion.span
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {subscriptionPlan}
                </motion.span>
              )}
            </div>
          )}

          {/* Loading indicator */}
          {showLoading && (
            <div className="hidden md:flex items-center">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          )}

          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearchOpen}
            className="relative h-8 w-8 rounded-full"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Search Modal */}
          <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} onResultClick={handleResultClick} />

          <ThemeToggle />

          {session && <NotificationsMenu />}

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </motion.header>
  )
}
