"use client"

import type React from "react"
import { useEffect, useState, memo, useCallback, useRef } from "react"
import { Filter, ChevronDown, Target, Brain, Code, PenTool, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import type { QuizType } from "@/app/types/quiz-types"
import { cn } from "@/lib/utils"

const quizTypes = [
  {
    id: "mcq" as const,
    label: "Multiple Choice",
    icon: Target,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    id: "openended" as const,
    label: "Open Ended",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    id: "blanks" as const,
    label: "Fill Blanks",
    icon: PenTool,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    id: "code" as const,
    label: "Code",
    icon: Code,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    id: "flashcard" as const,
    label: "Flash Cards",
    icon: Lightbulb,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
]

interface QuizSidebarProps {
  search: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  isSearching: boolean
  selectedTypes: QuizType[]
  toggleQuizType: (type: QuizType) => void
  questionCountRange?: [number, number]
  onQuestionCountChange?: (range: [number, number]) => void
  showPublicOnly?: boolean
  onPublicOnlyChange?: (value: boolean) => void
}

function QuizSidebarComponent({
  search,
  onSearchChange,
  onClearSearch,
  selectedTypes,
  toggleQuizType,
  questionCountRange = [0, 50],
  onQuestionCountChange,
  showPublicOnly = false,
  onPublicOnlyChange,
}: QuizSidebarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [localQuestionCount, setLocalQuestionCount] = useState<[number, number]>(questionCountRange)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setLocalQuestionCount(questionCountRange)
  }, [questionCountRange])

  const handleQuestionCountChange = useCallback(
    (value: number[]) => {
      if (value.length >= 2) {
        setLocalQuestionCount([value[0], value[1]])
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
        debounceTimer.current = setTimeout(() => {
          onQuestionCountChange?.([value[0], value[1]])
        }, 300)
      }
    },
    [onQuestionCountChange],
  )

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const hasActiveFilters = selectedTypes.length > 0 || search.length > 0 || showPublicOnly

  const renderFilters = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Use Case</Label>
          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedTypes.forEach(toggleQuizType)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {quizTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id)
            const TypeIcon = type.icon
            return (
              <label key={type.id} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuizType(type.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 border-2 rounded transition-all duration-200",
                      isSelected ? "bg-primary border-primary" : "border-border group-hover:border-muted-foreground",
                    )}
                  >
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn("p-1.5 rounded-md", type.bg, type.border, "border")}>
                    <TypeIcon className={cn("h-3.5 w-3.5", type.color)} />
                  </div>
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {type.label}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Question Count Range */}
      {onQuestionCountChange && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground">Question Count</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={50}
              step={1}
              value={[localQuestionCount[0], localQuestionCount[1]]}
              onValueChange={handleQuestionCountChange}
              className="my-6"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{localQuestionCount[0]} min</span>
              <span>{localQuestionCount[1]} max</span>
            </div>
          </div>
        </div>
      )}

      {/* Public Only Toggle */}
      {onPublicOnlyChange && (
        <>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">Public Only</Label>
              <p className="text-xs text-muted-foreground">Show only public templates</p>
            </div>
            <Switch checked={showPublicOnly} onCheckedChange={onPublicOnlyChange} />
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 shrink-0">
        <Card className="sticky top-6 bg-card border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Filter Quizzes</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>{renderFilters()}</CardContent>
        </Card>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full justify-between bg-card border-border/50"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter Templates</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showMobileFilters && "rotate-180")} />
        </Button>

        <Collapsible open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <CollapsibleContent>
            <Card className="mt-4 bg-card border-border/50">
              <CardContent className="pt-6">{renderFilters()}</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  )
}

export const QuizSidebar = memo(QuizSidebarComponent)
