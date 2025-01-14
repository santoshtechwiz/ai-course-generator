import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Session } from "next-auth"
import { LogOut, LogIn, Search } from 'lucide-react'
import { signIn, signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NavItem } from "../types"


interface MobileMenuProps {
  session: Session | null
  navItems: NavItem[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  handleSearch: (e: React.FormEvent) => void
}

export function MobileMenu({
  session,
  navItems,
  searchTerm,
  setSearchTerm,
  handleSearch,
}: MobileMenuProps) {
  return (
    <SheetContent side="left" className="w-full sm:max-w-md p-0">
      <div className="flex flex-col h-full bg-background text-foreground">
        <SheetHeader className="px-4 py-6 border-b">
          <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow px-4">
          <div className="py-6 space-y-6">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <Button type="submit" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
            <nav>
              <ul className="space-y-2">
                {navItems.map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </div>
        </ScrollArea>
        <div className="mt-auto p-4 border-t">
          {session ? (
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button onClick={() => signIn()} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </SheetContent>
  )
}

