"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import { Loader2, Search, X, Book, FileQuestion } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import debounce from "lodash/debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchResult {
  id: number
  name?: string
  description?: string
  slug?: string
  title?: string
  quizType?: "mcq" | "openended" | "fill-blanks" | "code"
}

interface SearchResponse {
  courses: SearchResult[]
  games: SearchResult[]
}

interface SearchModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onResultClick: (url: string) => void
}

export default function SearchModal({ isOpen, setIsOpen, onResultClick }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showLoader, setShowLoader] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const loaderTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchSearchResults = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        setIsLoading(true)
        loaderTimeoutRef.current = setTimeout(() => setShowLoader(true), 300)

        try {
          const response = await axios.get<SearchResponse>(`/api/search?query=${encodeURIComponent(query)}`)
          setSearchResults(response.data)
        } catch (error) {
          console.error("Error fetching search results:", error)
          setSearchResults(null)
        } finally {
          clearTimeout(loaderTimeoutRef.current)
          setIsLoading(false)
          setShowLoader(false)
        }
      } else {
        setSearchResults(null)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      fetchSearchResults(searchTerm)
    } else {
      setSearchResults(null)
    }
    return () => {
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current)
      }
    }
  }, [searchTerm, fetchSearchResults])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    return () => {
      setSearchTerm("")
      setSearchResults(null)
      setSelectedIndex(-1)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        Math.min(prev + 1, (searchResults?.courses.length || 0) + (searchResults?.games.length || 0) - 1),
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex !== -1) {
      e.preventDefault()
      const allResults = [...(searchResults?.courses || []), ...(searchResults?.games || [])]
      const selected = allResults[selectedIndex]
      if (selected) {
        handleResultClick(selected)
      }
    }
  }

  const handleResultClick = (result: SearchResult) => {
    let url
    if (result.title && ["mcq", "openended", "fill-blanks", "code"].includes(result.quizType || "")) {
      // This is a game/quiz
      url = `/dashboard/${result.quizType === "fill-blanks" ? "blanks" : result.quizType}/${result.slug}`
    } else {
      // This is a course
      url = `/dashboard/course/${result.slug}`
    }

    onResultClick(url)
    setIsOpen(false)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={`highlight-${index}-${part}`} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </span>
      ) : (
        <span key={`text-${index}-${part.substring(0, 5)}`}>{part}</span>
      ),
    )
  }

  const renderSearchResult = (result: SearchResult, index: number, type: "course" | "game") => (
    <motion.li
      key={result.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg p-3 transition-colors ${
        index === selectedIndex
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted border border-transparent hover:border-muted-foreground/20"
      }`}
    >
      <button
        onClick={() => handleResultClick(result)}
        className="w-full text-left focus:outline-none focus:ring-0 flex items-start space-x-3"
      >
        {type === "course" ? (
          <Book className={`h-5 w-5 flex-shrink-0 mt-1 ${index === selectedIndex ? "text-primary" : ""}`} />
        ) : (
          <FileQuestion className={`h-5 w-5 flex-shrink-0 mt-1 ${index === selectedIndex ? "text-primary" : ""}`} />
        )}
        <div className="flex-grow min-w-0">
          <p className={`font-medium text-base truncate ${index === selectedIndex ? "text-primary" : ""}`}>
            {highlightMatch(result.title || result.name || "", searchTerm)}
          </p>
          {type === "course" && result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {highlightMatch(result.description.substring(0, 100), searchTerm)}
            </p>
          )}
          {type === "game" && (
            <p className="text-sm text-muted-foreground mt-1">{result.quizType?.toUpperCase()} Quiz</p>
          )}
        </div>
      </button>
    </motion.li>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] w-[90vw] max-h-[90vh] p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="text-xl font-semibold">Search Courses and Quizzes</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-4">
            <div className="relative w-full mb-4 focus-within:ring-2 focus-within:ring-primary/50 rounded-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search courses and quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 h-12 text-lg border-primary/20 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 -mr-4 pr-4 max-h-[calc(90vh-180px)]">
              {showLoader ? (
                <div className="flex flex-col justify-center items-center py-8 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground animate-pulse">Searching...</p>
                </div>
              ) : searchResults && (searchResults?.courses?.length > 0 || searchResults?.games?.length > 0) ? (
                <div className="space-y-6">
                  <AnimatePresence>
                    {searchResults.courses.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <h3 className="text-lg font-semibold mb-3">Courses</h3>
                        <ul className="space-y-2">
                          {searchResults.courses.map((course, index) => renderSearchResult(course, index, "course"))}
                        </ul>
                      </motion.div>
                    )}
                    {searchResults.games.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <h3 className="text-lg font-semibold mb-3">Quizzes</h3>
                        <ul className="space-y-2">
                          {searchResults.games.map((game, index) =>
                            renderSearchResult(game, searchResults.courses.length + index, "game"),
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : searchTerm.trim().length >= 2 ? (
                <p className="text-center text-muted-foreground text-lg py-8">No results found</p>
              ) : null}
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-muted rounded text-xs mr-1">↑</kbd>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                <span className="ml-2">to navigate</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                <span className="ml-2">to select</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

