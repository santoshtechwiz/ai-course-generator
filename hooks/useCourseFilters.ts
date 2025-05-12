"use client"

import { useState, useCallback } from "react"
import { useDebounce } from "./useDebounce"

interface UseCourseFiltersProps {
  initialCategories?: string[]
  initialDuration?: [number, number]
  initialSearch?: string
}

export function useCourseFilters({
  initialCategories = [],
  initialDuration = [0, 20],
  initialSearch = "",
}: UseCourseFiltersProps = {}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [duration, setDuration] = useState<[number, number]>(initialDuration)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const debouncedSearch = useDebounce(searchQuery, 300)
  const debouncedDuration = useDebounce(duration, 500)

  // Toggle category selection
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }, [])

  // Update duration range
  const updateDuration = useCallback((min: number, max: number) => {
    setDuration([min, max])
  }, [])

  // Update search query
  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSelectedCategories([])
    setDuration([0, 20])
    setSearchQuery("")
  }, [])

  return {
    selectedCategories,
    duration,
    debouncedDuration,
    searchQuery,
    debouncedSearch,
    toggleCategory,
    updateDuration,
    updateSearch,
    resetFilters,
  }
}
