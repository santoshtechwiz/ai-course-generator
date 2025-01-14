"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Menu, Search, LogOut, LogIn, X, User, ChevronDown, Lightbulb, CreditCard, Bell } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"

import SearchModal from "./SearchModal"
import { Loader } from "@/components/ui/loader"
import { MobileMenu } from "./MobileMenu"
import Logo from "./Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { navItems } from "@/constants/navItems"
import NotificationsMenu from "./NotificationsMenu"

const MotionLink = motion(Link)

const NavItem = React.memo(({ item, isActive, hoveredItem, setHoveredItem, router }) => {
  return (
    <motion.div
      key={item.name}
      className="relative group"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: item.index * 0.1 }}
    >
      {item.subItems.length > 0 ? (
        <DropdownMenu onOpenChange={(open) => open && setHoveredItem(item.name)}>
          <DropdownMenuTrigger asChild>
            <motion.button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground inline-flex items-center ${
                isActive(item.href) ? 'bg-primary/10 text-primary' : ''
              }`}
              onHoverStart={() => setHoveredItem(item.name)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
              <motion.div
                animate={{ rotate: hoveredItem === item.name ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="ml-1 h-4 w-4" />
              </motion.div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            onMouseLeave={() => setHoveredItem(null)}
            className="w-56"
          >
            <AnimatePresence>
              {item.subItems.map((subItem, idx) => (
                <motion.div
                  key={subItem.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href={subItem.href}
                      className={`w-full ${
                        isActive(subItem.href) ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={isActive(item.href) ? "secondary" : "ghost"}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
              isActive(item.href) ? 'bg-primary/10 text-primary' : ''
            }`}
            onClick={() => router.push(item.href)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
})

NavItem.displayName = "NavItem";

const SearchBar = React.memo(({ searchTerm, setSearchTerm, handleSearch }) => {
  return (
    <motion.form
      onSubmit={handleSearch}
      className="relative hidden md:block w-full max-w-sm xl:max-w-md flex items-center"
      initial={false}
      animate={searchTerm ? "expanded" : "collapsed"}
      variants={{
        expanded: { width: "100%" },
        collapsed: { width: "100%" }
      }}
    >
      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search or ask AI..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8 pr-10 w-full rounded-full bg-muted transition-all duration-300 focus:ring-2 focus:ring-primary"
        aria-label="Search"
      />
      <AnimatePresence>
        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.form>
  )
})

SearchBar.displayName = "SearchBar";

const UserMenu = React.memo(({ status, session, handleSignOut }) => {
  if (status === "authenticating") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader size={20} />
      </motion.div>
    )
  }

  if (status === "authenticated" && session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session.user.image ?? undefined}
                alt={session.user.name ?? "User"}
              />
              <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
            </Avatar>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session.user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/subscriptions" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscriptions</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button onClick={() => signIn()} variant="default" size="sm">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    </motion.div>
  )
})

UserMenu.displayName = "UserMenu";

export default function ResponsiveHeader() {
  const { data: session, status } = useSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      setIsModalOpen(true)
    }
  }, [searchTerm])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false })
    router.push('/')
  }, [router])

  const isActive = useCallback((href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') {
      return true
    }
    return pathname.startsWith(href) && href !== '/dashboard'
  }, [pathname])

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        }
      }}
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Sheet>
  <SheetTrigger asChild>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-0 lg:hidden"
      aria-label="Toggle Menu"
    >
      <Menu className="h-5 w-5" />
    </motion.button>
  </SheetTrigger>
  <MobileMenu
    session={session}
    navItems={navItems}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    handleSearch={handleSearch}
  />
</Sheet>

          <MotionLink
            href="/"
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo
              size="small"
              variant="default"
              textColor="currentColor"
              iconColor="currentColor"
            />
            <Lightbulb className="h-6 w-6 text-primary" />
          </MotionLink>
        </div>

        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item, index) => (
            <NavItem
              key={item.name}
              item={{...item, index}}
              isActive={isActive}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
              router={router}
            />
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
          />

          <NotificationsMenu />

          <ThemeToggle />

          <UserMenu
            status={status}
            session={session}
            handleSignOut={handleSignOut}
          />

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex items-center justify-center w-10 h-10"
              onClick={() => setIsModalOpen(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        searchTerm={searchTerm}
        onResultClick={(url: string) => {
          setIsModalOpen(false)
          router.push(url)
        }}
      />
    </motion.header>
  )
}

