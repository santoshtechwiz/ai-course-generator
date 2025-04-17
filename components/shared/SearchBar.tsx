"use client"

import type React from "react"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SearchBarProps {
  onSearch: (term: string) => void
}

// Enhance the SearchBar with animations and improved responsiveness
export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  return (
    <motion.form
      onSubmit={handleSearch}
      className="flex items-center relative"
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative w-full">
        <motion.div
          animate={{
            scale: isFocused ? 1.1 : 1,
            x: isFocused ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </motion.div>
        <motion.div
          animate={{
            boxShadow: isFocused ? "0 0 0 2px rgba(var(--primary), 0.3)" : "0 0 0 0 rgba(var(--primary), 0)",
          }}
          transition={{ duration: 0.2 }}
          className="rounded-lg overflow-hidden"
        >
          <Input
            type="search"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-10 pr-12 w-full md:w-[300px] rounded-lg border-muted focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200"
          />
        </motion.div>
        {searchTerm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-12 top-1/2 -translate-y-1/2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm("")}
              className="h-6 w-6 rounded-full p-0 hover:bg-muted/80"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          </motion.div>
        )}
      </div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="ml-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
        >
          Search
        </Button>
      </motion.div>
    </motion.form>
  )
}
