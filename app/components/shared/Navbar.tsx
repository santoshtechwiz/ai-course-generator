"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogOut, LogIn, User, Crown } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import SearchModal from "./SearchModal"

import { Badge } from "@/components/ui/badge"
import MobileMenu from "./MobileMenu"
import Link from "next/link"
import useSubscriptionStore from "@/store/useSubscriptionStore"

const NavItems = () => {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <motion.div className="flex space-x-2">
      {navItems.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 20 }}
        >
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className={`relative overflow-hidden group px-3 ${
              pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
            }`}
            onClick={() => router.push(item.href)}
          >
            <span className="relative z-10">{item.name}</span>
            <motion.span
              className="absolute inset-0 bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: pathname === item.href ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false);
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStore();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const handleSignIn = () => signIn()
  const handleSignOut = async () => {
    const currentUrl = window.location.pathname
    await signOut({ callbackUrl: currentUrl })
  }

  const getSubscriptionBadge = () => {
    if (isLoadingSubscription || !subscriptionStatus) return null
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE"
    const color = plan === "PRO" ? "yellow" : plan === "BASIC" ? "blue" : "gray"
    return (
      <Badge variant="outline" className={`bg-${color}-500/10 text-${color}-500 border-${color}-500/20`}>
        {plan}
      </Badge>
    )
  }

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg transition-all duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 flex-1">
          <MobileMenu />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Logo />
          </motion.div>
          <nav className="hidden md:flex items-center space-x-4 flex-1 justify-center" aria-label="Main Navigation">
            <NavItems />
          </nav>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <NotificationsMenu initialCount={subscriptionStatus?.credits ?? 0} />
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ThemeToggle />
          </motion.div>

          <AnimatePresence mode="wait">
            {status === "authenticated" && session ? (
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "User"} />
                          <AvatarFallback>{session.user?.name?.[0] ?? "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1 p-2" forceMount>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col space-y-1 leading-none mb-2">
                        {session.user?.name && <p className="font-medium">{session.user.name}</p>}
                        {session.user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                        )}
                        {getSubscriptionBadge()}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" replace className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/subscription" replace className="flex items-center">
                          <Crown className="mr-2 h-4 w-4" />
                          <span>Subscription</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center text-destructive hover:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </motion.div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ) : (
              <motion.div
                key="sign-in-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="default" size="sm" onClick={handleSignIn}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SearchModal
        isOpen={isSearchModalOpen}
        setIsOpen={setIsSearchModalOpen}
        onResultClick={(url) => {
          router.push(url)
          setIsSearchModalOpen(false)
        }}
      />
    </motion.header>
  )
}