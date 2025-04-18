"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
  placeholder?: string
}

export function SearchBar({
  search,
  onSearchChange,
  onClearSearch,
  isSearching,
  placeholder = "Search quizzes...",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (search) {
      setIsTyping(true)
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 500)
    } else {
      setIsTyping(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [search])

  return (
    <div className="relative group">
      <motion.div
        className="absolute inset-0 rounded-md"
        animate={{
          boxShadow: isFocused ? "0 0 0 2px rgba(var(--primary), 0.3)" : "none",
        }}
        transition={{ duration: 0.2 }}
      />

      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={search}
          onChange={onSearchChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-10 py-2 h-10 bg-background border-input"
        />

        <AnimatePresence>
          {search && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onClearSearch()
                    inputRef.current?.focus()
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSearching && search && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-0 text-xs text-muted-foreground"
        >
          Searching for "{search}"...
        </motion.div>
      )}
    </div>
  )
}
