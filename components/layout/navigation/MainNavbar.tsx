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

export default function MainNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { user, isAuthenticated } = useAuth()
  const { totalTokens, tokenUsage, subscriptionPlan, isLoading: isSubscriptionLoading } = useSubscription()

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle initial loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Calculate credits
  const credits = totalTokens || user?.credits || 0
  const availableCredits = credits - tokenUsage
  const showLoading = isLoading && isAuthenticated

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
          {isAuthenticated && !showLoading && (
            <div className="hidden md:flex items-center space-x-1" data-testid="credits-display">
              <div className="text-sm font-medium">Credits: {availableCredits}</div>
              {subscriptionPlan !== "FREE" && (
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

          {session && <NotificationsMenu />}

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
