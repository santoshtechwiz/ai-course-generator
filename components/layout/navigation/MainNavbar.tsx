"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Search } from "lucide-react"
import { navItems } from "@/constants/navItems"
import { ThemeToggle } from "@/components/layout/navigation/ThemeToggle"
import MobileMenu from "@/components/layout/navigation/MobileMenu"
import { UserMenu } from "@/components/layout/navigation/UserMenu"
import SearchModal from "@/components/layout/navigation/SearchModal"
import { Button } from "@/components/ui/button"
import Logo from "./Logo"
import useSubscription from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import NotificationsMenu from "@/components/Navbar/NotificationsMenu"

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, isAuthenticated, isLoading: authLoading, status: authStatus } = useAuth()
  const { totalTokens, tokenUsage, subscriptionPlan, isLoading: isSubscriptionLoading } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (authStatus !== "loading") {
      requestAnimationFrame(() => setReady(true))
    }
  }, [authStatus])

  const credits = totalTokens ?? user?.credits ?? 0
  const availableCredits = useMemo(() => {
    if (typeof credits === "number" && typeof tokenUsage === "number") {
      return credits - tokenUsage
    }
    return null
  }, [credits, tokenUsage])

  const userImage = user?.image || ""
  const userName = user?.name || ""
  const userInitial = userName ? userName.charAt(0) : "U"

  const navLinks = useMemo(() => (
    navItems.map((item) => {
      const isActive = pathname === item.href
      return (
        <Link href={item.href} key={item.name} data-testid={`nav-item-${item.name.toLowerCase()}`}>
          <div className={`relative py-2 text-sm font-medium transition-colors ${
            isActive ? "text-primary font-semibold" : "text-foreground hover:text-primary/80"
          }`}>
            {item.name}
            {isActive && <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />}
          </div>
        </Link>
      )
    })
  ), [pathname])

  const userAvatar = useMemo(() => (
    <Avatar className="h-8 w-8 border border-border/50 hover:border-primary/30 transition-all">
      <AvatarImage src={userImage} />
      <AvatarFallback className="bg-primary/5 text-primary">{userInitial}</AvatarFallback>
    </Avatar>
  ), [userImage, userInitial])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? "bg-background/95 shadow-sm" : "bg-background/80"} backdrop-blur-sm border-b transition-all duration-300`}
      data-testid="main-navbar"
    >
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Logo />

        <nav className="mx-6 hidden items-center space-x-8 md:flex" data-testid="nav-items">
          {navLinks}
        </nav>

        <div className="flex items-center ml-auto space-x-4">
          {/* Credits */}
          {isAuthenticated && availableCredits !== null && (
            <div className="hidden md:flex items-center space-x-1" data-testid="credits-display">
              <div className="text-sm font-medium">Credits: {availableCredits.toLocaleString()}</div>
              {subscriptionPlan && subscriptionPlan !== "FREE" && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{subscriptionPlan}</span>
              )}
            </div>
          )}

          {/* Credits loading */}
          {isAuthenticated && availableCredits === null && (
            <div className="hidden md:flex items-center">
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          )}

          {/* Search */}
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

          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={(url) => {
              router.push(url)
              setIsSearchModalOpen(false)
            }}
          />

          <ThemeToggle />

          {/* Notifications */}
          {isAuthenticated && (
            <div className={`transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}>
              <NotificationsMenu />
            </div>
          )}

          {/* UserMenu */}
          <div className={`transition-all duration-300 ${!authLoading && ready ? 'scale-100 opacity-100' : 'scale-95 opacity-90'}`}>
            <UserMenu>
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                  aria-label="User menu"
                >
                  {userAvatar}
                </Button>
              ) : authLoading ? (
                <div className="animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : (
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

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
