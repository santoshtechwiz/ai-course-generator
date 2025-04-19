"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Search, Filter, Clock, BookOpen, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface ExploreSidebarProps {
  categories?: string[]
  selectedCategories?: string[]
  onCategoryChange?: (category: string) => void
  onDurationChange?: (min: number, max: number) => void
  onSearchChange?: (search: string) => void
  duration?: [number, number]
  searchQuery?: string
}

export function ExploreSidebar({
  categories = [],
  selectedCategories = [],
  onCategoryChange,
  onDurationChange,
  onSearchChange,
  duration = [0, 20],
  searchQuery = "",
}: ExploreSidebarProps) {
  const [localDuration, setLocalDuration] = useState<[number, number]>(duration)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Apply filters when duration changes
  useEffect(() => {
    if (typeof onDurationChange === "function") {
      const timeoutId = setTimeout(() => {
        onDurationChange(localDuration[0], localDuration[1])
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [localDuration, onDurationChange])

  // Apply search when search query changes
  useEffect(() => {
    if (typeof onSearchChange === "function") {
      const timeoutId = setTimeout(() => {
        onSearchChange(localSearch)
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [localSearch, onSearchChange])

  // Handle slider value change
  const handleSliderChange = (value: number[]) => {
    setLocalDuration([value[0], value[1]])
  }

  // Default categories if none provided
  const defaultCategories = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
    "Game Development",
    "UI/UX Design",
  ]

  const displayCategories = categories.length > 0 ? categories : defaultCategories

  return (
    <div className="w-full space-y-6">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Search className="h-5 w-5 mr-2 text-muted-foreground" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Tag className="h-5 w-5 mr-2 text-muted-foreground" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-4">
              {displayCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => onCategoryChange && onCategoryChange(category)}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
            Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="px-2">
            <Slider
              min={0}
              max={20}
              step={1}
              value={[localDuration[0], localDuration[1]]}
              onValueChange={handleSliderChange}
              className="my-6"
            />
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                {localDuration[0]} hrs
              </Badge>
              <Badge variant="outline" className="font-mono">
                {localDuration[1]} hrs
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Beginner
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Intermediate
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Advanced
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Popular
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              New
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Trending
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Free
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Premium
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Reset Filters */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setLocalDuration([0, 20])
            setLocalSearch("")
            // Reset categories would be handled by the parent component
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  )
}

export default ExploreSidebar
