"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Search, LogIn, User, LogOut, Menu, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { navItems } from "@/constants/navItems"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"
import SearchModal from "./SearchModal"
import { Badge } from "@/components/ui/badge"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { DropdownMenuContent, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { UserMenu } from "./UserMenu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"

// Update the NavItems component for better spacing and hover effects
const NavItems = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav className="mx-6 hidden items-center space-x-2 md:flex">
      {navItems.map((item) => (
        <motion.div
          key={item.name}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => router.push(item.href)}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
            {item.subItems.length > 0 && <ChevronDown className="h-3 w-3 ml-1.5" />}
          </Button>
        </motion.div>
      ))}
    </nav>
  )
}

export default function MainNavbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const { subscriptionStatus, isLoading: isLoadingSubscription } = useSubscriptionStore()
  const pathname = usePathname()

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
    const plan = subscriptionStatus.subscriptionPlan as "PRO" | "BASIC" | "FREE" | "ULTIMATE"

    const badgeVariant =
      plan === "PRO" ? "default" : plan === "BASIC" ? "secondary" : plan === "ULTIMATE" ? "outline" : "outline"

    const badgeClass =
      plan === "PRO"
        ? "bg-primary text-primary-foreground"
        : plan === "ULTIMATE"
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          : ""

    return (
      <Badge variant={badgeVariant} className={`ml-2 ${badgeClass}`}>
        {plan}
      </Badge>
    )
  }

  return (
    // Update the main header component
    <motion.header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        scrolled ? "shadow-md" : ""
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Logo />
          </motion.div>
          <NavItems />
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchModalOpen(true)}
            className="rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          <NotificationsMenu initialCount={subscriptionStatus?.credits ?? 0} />
          <ThemeToggle />

          {status === "authenticated" ? (
            <UserMenu>
              <DropdownMenuContent className="w-56 rounded-xl p-2" align="end" forceMount>
                <div className="flex flex-col space-y-1.5 p-2">
                  {session?.user?.name && <p className="font-medium">{session.user.name}</p>}
                  {session?.user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                  )}
                  {getSubscriptionBadge()}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer rounded-md py-1.5">
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center cursor-pointer rounded-md text-destructive focus:text-destructive py-1.5"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </UserMenu>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden md:block">
              <Button
                variant="default"
                size="sm"
                onClick={handleSignIn}
                className="rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </motion.div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden rounded-full hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isSearchModalOpen && (
          <SearchModal
            isOpen={isSearchModalOpen}
            setIsOpen={setIsSearchModalOpen}
            onResultClick={(url) => {
              router.push(url)
              setIsSearchModalOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center">
                <Logo size="small" />
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-auto py-2">
              <nav className="flex flex-col space-y-1 p-2">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.name}>
                    <Button
                      variant="ghost"
                      className={`justify-start rounded-md ${
                        pathname === item.href ? "bg-accent text-accent-foreground" : ""
                      }`}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  </SheetClose>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t mt-auto">
              {status === "authenticated" ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="font-medium truncate">{session?.user?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                    {getSubscriptionBadge()}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        onClick={() => router.push("/dashboard")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </SheetClose>
                    <Button variant="destructive" className="w-full justify-center" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-center"
                  onClick={() => {
                    handleSignIn()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  )
}

