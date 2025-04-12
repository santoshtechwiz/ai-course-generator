"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"

interface SearchBarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
}

export function SearchBar({ search, onSearchChange, onClearSearch, isSearching }: SearchBarProps) {
  return (
    <div className="relative w-full group">
      {/* Left Search Icon */}
      <motion.div
        className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: search ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
      >
        <Search className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      {/* Search Input */}
      <Input
        type="search"
        placeholder="Search quizzes..."
        value={search}
        onChange={onSearchChange}
        className="pl-10 pr-10 w-full h-11 rounded-md border border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
      />

      {/* Clear Search Button */}
      <AnimatePresence>
        {isSearching && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={onClearSearch}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
