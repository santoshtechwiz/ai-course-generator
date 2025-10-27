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
    if (result.type === 'quiz' && result.metadata?.quizType) {
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
        <span key={`highlight-${index}-${part}`} className="bg-[var(--color-warning)] text-[var(--color-text)] px-1 font-black">
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
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className={cn(
          "rounded-none p-4 transition-all duration-150 border-6",
          index === selectedIndex
            ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[4px_4px_0_var(--shadow-color)] translate-x-[-2px] translate-y-[-2px]"
            : "bg-[var(--color-card)] border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--shadow-color)]",
          isLoading && "opacity-75 pointer-events-none"
        )}
      >
        <motion.button
          onClick={() => handleResultClick(result)}
          disabled={isLoading}
          className="w-full text-left focus:outline-none flex items-start space-x-3"
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "h-6 w-6 flex-shrink-0 mt-1",
            index === selectedIndex && "opacity-100"
          )}>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : type === "course" ? (
              <Book className="h-6 w-6" />
            ) : (
              <FileQuestion className="h-6 w-6" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <p className={cn(
              "font-black text-base truncate",
              isLoading && "opacity-70"
            )}>
              {isLoading ? "Loading..." : highlightMatch(result.title, searchTerm)}
            </p>
            {type === "course" && result.description && !isLoading && (
              <p className={cn(
                "text-sm mt-1 line-clamp-2",
                index === selectedIndex ? "opacity-90" : "opacity-70"
              )}>
                {highlightMatch(result.description, searchTerm)}
              </p>
            )}
            {type === "game" && result.metadata && !isLoading && (
              <div className={cn(
                "text-sm mt-1 font-bold uppercase tracking-wider",
                index === selectedIndex ? "opacity-90" : "opacity-70"
              )}>
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
      <DialogContent className="sm:max-w-[700px] w-[90vw] max-h-[90vh] p-0 border-6 border-[var(--color-border)] bg-[var(--color-card)] shadow-[8px_8px_0_var(--shadow-color)] rounded-none overflow-hidden">
        <motion.div
          className="flex flex-col h-full max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
        >
          <DialogHeader className="px-6 py-4 border-b-6 border-[var(--color-border)] bg-[var(--color-bg)]">
            <DialogTitle className="text-xl font-black uppercase tracking-wider">
              Search Courses & Quizzes
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-6">
            <motion.div
              className="relative w-full mb-6"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--color-text)] pointer-events-none z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search courses and quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-14 pr-14 h-14 text-lg font-bold border-6 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[4px_4px_0_var(--shadow-color)] focus-visible:shadow-[6px_6px_0_var(--shadow-color)] focus-visible:translate-x-[-2px] focus-visible:translate-y-[-2px] transition-all duration-150"
              />
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 border-4 border-[var(--color-border)] bg-[var(--color-bg)] rounded-none shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <Alert variant="destructive" className="border-6 border-[var(--color-border)] bg-[var(--color-error)] text-white shadow-[4px_4px_0_var(--shadow-color)] rounded-none">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className="font-bold">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}

                {isLoading && showLoader ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-16"
                  >
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                      <span className="font-black text-lg uppercase">Searching...</span>
                    </div>
                  </motion.div>
                ) : searchResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {searchResults.courses && searchResults.courses.length > 0 && (
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center space-x-2 px-2 py-2 bg-[var(--color-bg)] border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] rounded-none">
                          <Book className="h-5 w-5" />
                          <span>Courses ({searchResults.courses.length})</span>
                        </h3>
                        <ul className="space-y-3">
                          {searchResults.courses.map((course, index) =>
                            renderSearchResult(course, index, "course"),
                          )}
                        </ul>
                      </div>
                    )}

                    {searchResults.games && searchResults.games.length > 0 && (
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider mb-3 flex items-center space-x-2 px-2 py-2 bg-[var(--color-bg)} border-4 border-[var(--color-border)] shadow-[3px_3px_0_var(--shadow-color)] rounded-none">
                          <FileQuestion className="h-5 w-5" />
                          <span>Quizzes ({searchResults.games.length})</span>
                        </h3>
                        <ul className="space-y-3">
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
                        className="text-center py-16 border-6 border-dashed border-[var(--color-border)] bg-[var(--color-muted)] rounded-none"
                      >
                        <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-black mb-2 uppercase">No results found</p>
                        <p className="text-sm opacity-70">Try adjusting your search terms</p>
                      </motion.div>
                    )}
                  </motion.div>
                ) : searchTerm.length >= 2 ? null : (
                  <motion.div
                    key="no-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16 border-6 border-dashed border-[var(--color-border)] bg-[var(--color-muted)] rounded-none"
                  >
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-black mb-2 uppercase">Start typing to search</p>
                    <p className="text-sm opacity-70">Search for courses, quizzes, or topics</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            className="p-4 border-t-6 border-[var(--color-border)] bg-[var(--color-bg)]"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="flex items-center justify-center gap-6 text-sm font-bold">
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-2 bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] text-xs font-black rounded-none">↑</kbd>
                <kbd className="px-3 py-2 bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] text-xs font-black rounded-none">↓</kbd>
                <span className="uppercase text-xs tracking-wider">Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-2 bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[2px_2px_0_var(--shadow-color)] text-xs font-black rounded-none">Enter</kbd>
                <span className="uppercase text-xs tracking-wider">Select</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}