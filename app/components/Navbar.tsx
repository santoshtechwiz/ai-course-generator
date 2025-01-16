"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { Menu, Search, LogOut, LogIn, User, ChevronDown, X, Settings, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { navItems } from "@/constants/navItems"
import { CreateSection } from "./create-section"

import SearchModal from "./SearchModal"
import Logo from "./Logo"
import NotificationsMenu from "./NotificationsMenu"

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-full sm:w-[350px]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Logo />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-full"
              />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {item.name === "Create" ? (
                    <div className="space-y-2">
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setIsCreateOpen(!isCreateOpen)}
                      >
                        {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronRight className={cn("h-4 w-4 transition-transform ml-2", isCreateOpen && "rotate-90")} />
                      </Button>
                      <AnimatePresence>
                        {isCreateOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 space-y-2"
                          >
                            <CreateSection />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        router.push(item.href)
                        setIsOpen(false)
                      }}
                    >
                      {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                      {item.name}
                    </Button>
                  )}
                </motion.div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            {session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={session.user?.image ?? undefined} />
                    <AvatarFallback>{session.user?.name?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => signIn()}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const NavItems = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      {navItems.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {item.name === "Create" ? (
            <DropdownMenu open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2",
                    pathname === item.href && "bg-accent"
                  )}
                >
                  {item.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[800px] p-0">
                <CreateSection />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant={pathname === item.href ? "secondary" : "ghost"}
              className="flex items-center gap-2"
              onClick={() => router.push(item.href)}
            >
              {item.name}
            </Button>
          )}
        </motion.div>
      ))}
    </>
  )
}

const EnhancedSearchBar = ({ onSearch }: { onSearch: () => void }) => (
  <motion.div 
    className="relative w-full max-w-[200px] md:max-w-sm"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Input
      type="search"
      placeholder="Search..."
      className="w-full rounded-full pl-10 pr-4 py-2 bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
      onClick={onSearch}
    />
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </motion.div>
)

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const router = useRouter()

  const handleSignIn = () => signIn()
  const handleSignOut = () => signOut()

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-lg shadow-sm"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 flex-1">
          <MobileMenu />
          <Logo />
        </div>

        <nav className="hidden md:flex items-center space-x-4 flex-1 justify-center" aria-label="Main Navigation">
          <NavItems />
        </nav>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="hidden sm:block">
            <EnhancedSearchBar onSearch={() => setIsSearchModalOpen(true)} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <NotificationsMenu initialCount={0} />
          </motion.div>

          <ThemeToggle />

          {status === "authenticated" && session ? (
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
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-500 hover:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="default" size="sm" onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </motion.div>
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
      />
    </motion.header>
  )
}

