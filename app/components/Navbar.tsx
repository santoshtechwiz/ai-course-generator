"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Menu, Search, LogOut, LogIn, User, ChevronDown, Cpu, Brain, Sparkles, Zap, CreditCard, Bell } from 'lucide-react'
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CreateSection } from "./create-section"
import { NavItem } from "../types"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import SearchModal from "./SearchModal"
import { SearchBar } from "./SearchBar"


const navItems: NavItem[] = [
  { 
    name: "Dashboard", 
    href: "/dashboard",
    icon: Cpu,
    subItems: []
  },
  { 
    name: "Courses", 
    href: "/dashboard/courses",
    icon: Brain,
    subItems: []
  },
  { 
    name: "Quizzes", 
    href: "/dashboard/quizzes",
    icon: Sparkles,
    subItems: []
  },
  { 
    name: "Create", 
    href: "/dashboard/create",
    icon: Zap,
    subItems: [
      { name: "New Course", href: "/dashboard/create", icon: Zap, subItems: [] },
      { name: "New MCQ Quiz", href: "/dashboard/quiz", icon: Zap, subItems: [] },
      { name: "New Open Quiz", href: "/dashboard/openended", icon: Zap, subItems: [] },
    ]
  },
  { 
    name: "Subscriptions", 
    href: "/dashboard/subscription",
    icon: CreditCard,
    subItems: []
  },
]

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  const isActive = useCallback((href: string) => {
    return pathname === href
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      router.push(item.href)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center space-x-2">
            <motion.span 
              className="font-bold inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              CourseAI
            </motion.span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <AnimatePresence>
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {item.name === "Create" ? (
                  <DropdownMenu open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-2",
                          isActive(item.href) && "bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start"
                      className="w-[800px] p-0"
                    >
                      <CreateSection />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="flex items-center gap-2"
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>

        <div className="flex items-center gap-4">
          <SearchBar onSearch={(term) => {
            setSearchTerm(term)
            setIsSearchModalOpen(true)
          }} />

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              // Handle notifications
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            <span className="sr-only">Notifications</span>
          </Button>

          <ThemeToggle />

          {status === "authenticated" && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={session.user?.image ?? undefined} 
                      alt={session.user?.name ?? "User"} 
                    />
                    <AvatarFallback>
                      {session.user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user?.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => signIn()}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      <SearchModal
        isOpen={isSearchModalOpen}
        setIsOpen={setIsSearchModalOpen}
        onResultClick={(url) => {
          router.push(url)
          setIsSearchModalOpen(false)
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </header>
  )
}

