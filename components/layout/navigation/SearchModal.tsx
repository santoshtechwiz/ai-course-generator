"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-helper"
import { Loader2, Search, X, Book, FileQuestion, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import debounce from "lodash/debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SearchResult {
  id: number
  title: string
  description?: string
  slug: string
  type?: "course" | "quiz"
  score?: number
  metadata?: {
    quizType?: string
    chapterName?: string
    courseTitle?: string
  }
}

interface SearchResponse {
  courses: SearchResult[]
  games: SearchResult[]
  total?: number
  query?: string
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
  const [error, setError] = useState<string | null>(null)
  const [loadingResultId, setLoadingResultId] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const loaderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSearchResults = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        setIsLoading(true)
        loaderTimeoutRef.current = setTimeout(() => setShowLoader(true), 300)

        try {
          const response = await api.get(`/api/search?query=${encodeURIComponent(query)}`)
          setSearchResults(response)
        } catch (error) {
          console.error("Error fetching search results:", error)
          setError("Failed to fetch search results. Please try again.")
          setSearchResults(null)
        } finally {
          clearTimeout(loaderTimeoutRef.current)
          setIsLoading(false)
          setShowLoader(false)
        }
      } else {
        setSearchResults(null)
        setError(null)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      fetchSearchResults(searchTerm)
    } else {
      setSearchResults(null)
      setError(null)
      setLoadingResultId(null)
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
      setLoadingResultId(null)
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

  const handleResultClick = async (result: SearchResult) => {
    setLoadingResultId(result.id)

    let url
    if (result.type === "quiz" && result.metadata?.quizType) {
      url = `/dashboard/${result.metadata.quizType === "blanks" ? "blanks" : result.metadata.quizType}/${result.slug}`
    } else if (result.slug) {
      url = `/dashboard/course/${result.slug}`
    } else {
      console.warn("No valid URL could be generated for search result:", result)
      setLoadingResultId(null)
      return
    }

    setTimeout(() => {
      onResultClick(url)
      setIsOpen(false)
      setLoadingResultId(null)
    }, 300)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span
          key={`highlight-${index}-${part}`}
          className="bg-[var(--color-warning)] dark:bg-[var(--color-warning)]/30"
        >
          {part}
        </span>
      ) : (
        <span key={`text-${index}-${part.substring(0, 5)}`}>{part}</span>
      ),
    )
  }

  const renderSearchResult = (result: SearchResult, index: number, type: "course" | "game") => {
    const isLoading = loadingResultId === result.id

    return (
      <motion.li
        key={result.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`rounded-lg p-3 transition-all border-2 border-[var(--color-border)] ${
          index === selectedIndex
            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] scale-[1.02]"
            : "hover:bg-[var(--color-muted)] hover:border-[var(--color-border)] hover:scale-[1.01]"
        } ${isLoading ? "opacity-75 pointer-events-none" : ""}`}
      >
        <motion.button
          onClick={() => handleResultClick(result)}
          disabled={isLoading}
          className="w-full text-left focus:outline-none focus:ring-0 flex items-start space-x-3"
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {type === "course" ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`h-5 w-5 flex-shrink-0 mt-1 ${index === selectedIndex ? "text-[var(--color-primary)]" : ""}`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Book className="h-5 w-5" />}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`h-5 w-5 flex-shrink-0 mt-1 ${index === selectedIndex ? "text-[var(--color-primary)]" : ""}`}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileQuestion className="h-5 w-5" />}
            </motion.div>
          )}
          <div className="flex-grow min-w-0">
            <p
              className={`font-medium text-base truncate ${index === selectedIndex ? "text-[var(--color-primary)]" : ""} ${isLoading ? "text-[var(--color-muted)]" : ""}`}
            >
              {isLoading ? "Loading..." : highlightMatch(result.title, searchTerm)}
            </p>
            {type === "course" && result.description && !isLoading && (
              <p className="text-sm text-[var(--color-muted)] mt-1 line-clamp-2">
                {highlightMatch(result.description, searchTerm)}
              </p>
            )}
            {type === "game" && result.metadata && !isLoading && (
              <div className="text-sm text-[var(--color-muted)] mt-1 space-y-1">
                <p>{result.metadata.quizType?.toUpperCase()} Quiz</p>
              </div>
            )}
          </div>
        </motion.button>
      </motion.li>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] w-[90vw] max-h-[90vh] p-0 border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)] overflow-hidden z-[var(--z-index-modal)]"
        style={{
          backdropFilter: "blur(12px)",
        }}
      >
        <motion.div
          className="flex flex-col h-full max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
        >
          <DialogHeader className="px-4 py-3 border-b-4 border-[var(--color-border)] bg-[var(--color-bg)]">
            <DialogTitle className="text-lg sm:text-xl font-black text-[var(--color-text)]">
              Search Courses and Quizzes
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-3 sm:p-4">
            <motion.div
              className="relative w-full mb-4 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/50 rounded-md"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-primary)] pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search courses and quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 h-12 text-base sm:text-lg border-[var(--color-primary)]/20 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg transition-all"
              />
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-[var(--color-muted)] rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-6">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}

                {isLoading && showLoader ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-12"
                  >
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                      <span className="text-[var(--color-muted)]">Searching...</span>
                    </div>
                  </motion.div>
                ) : searchResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {searchResults.courses && searchResults.courses.length > 0 && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-3 flex items-center space-x-2">
                          <Book className="h-4 w-4" />
                          <span>Courses ({searchResults.courses.length})</span>
                        </h3>
                        <ul className="space-y-2">
                          {searchResults.courses.map((course, index) => renderSearchResult(course, index, "course"))}
                        </ul>
                      </div>
                    )}

                    {searchResults.games && searchResults.games.length > 0 && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-3 flex items-center space-x-2">
                          <FileQuestion className="h-4 w-4" />
                          <span>Quizzes ({searchResults.games.length})</span>
                        </h3>
                        <ul className="space-y-2">
                          {searchResults.games.map((game, index) =>
                            renderSearchResult(game, index + (searchResults.courses?.length || 0), "game"),
                          )}
                        </ul>
                      </div>
                    )}

                    {(!searchResults.courses || searchResults.courses.length === 0) &&
                      (!searchResults.games || searchResults.games.length === 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <div className="text-[var(--color-muted)]">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No results found</p>
                            <p className="text-sm">Try adjusting your search terms or check your spelling</p>
                          </div>
                        </motion.div>
                      )}
                  </motion.div>
                ) : searchTerm.length >= 2 ? (
                  <motion.div
                    key="no-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="text-[var(--color-muted)]">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Start typing to search</p>
                      <p className="text-sm">Search for courses, quizzes, or topics</p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            className="p-3 sm:p-4 border-t-4 border-[var(--color-border)] bg-[var(--color-bg)]"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--color-muted)]">
              <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <kbd className="px-2 py-1 bg-[var(--color-muted)] rounded text-xs mr-1 border border-[var(--color-border)]">
                  ↑
                </kbd>
                <kbd className="px-2 py-1 bg-[var(--color-muted)] rounded text-xs border border-[var(--color-border)]">
                  ↓
                </kbd>
                <span className="ml-2">to navigate</span>
              </motion.div>
              <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <kbd className="px-2 py-1 bg-[var(--color-muted)] rounded text-xs border border-[var(--color-border)]">
                  Enter
                </kbd>
                <span className="ml-2">to select</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
