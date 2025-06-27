"use client"
import { Search, Filter, Grid3X3, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface ReviewControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterType: string
  setFilterType: (type: string) => void
  showAllQuestions: boolean
  setShowAllQuestions: (show: boolean) => void
}

export function ReviewControls({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  showAllQuestions,
  setShowAllQuestions,
}: ReviewControlsProps) {
  const filterOptions = [
    { value: "all", label: "All Questions", icon: "📝" },
    { value: "correct", label: "Correct Only", icon: "✅" },
    { value: "incorrect", label: "Incorrect Only", icon: "❌" },
  ]

  const getCurrentFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === filterType)
    return option ? `${option.icon} ${option.label}` : "All Questions"
  }

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search questions, answers, or explanations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="w-full lg:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-48 bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter questions" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getCurrentFilterLabel()}
            </Badge>
            <Button
              variant={showAllQuestions ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="flex items-center gap-2"
            >
              {showAllQuestions ? (
                <>
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">All View</span>
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Single View</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterType !== "all") && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {filterType !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {getCurrentFilterLabel()}
                <button onClick={() => setFilterType("all")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setFilterType("all")
              }}
              className="text-xs h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
