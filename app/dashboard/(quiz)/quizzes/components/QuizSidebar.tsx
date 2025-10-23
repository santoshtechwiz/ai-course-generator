"use client"

import type React from "react"
import { useEffect, useState, memo, useCallback, useRef } from "react"
import { Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import type { QuizType } from "@/app/types/quiz-types"
import { cn, getColorClasses } from "@/lib/utils"
import { QUIZ_TYPE_CONFIG } from "./quiz-type-config"

const quizTypes = [
  {
    id: "mcq" as const,
    label: QUIZ_TYPE_CONFIG.mcq.label,
    icon: QUIZ_TYPE_CONFIG.mcq.icon,
    color: QUIZ_TYPE_CONFIG.mcq.color,
    bg: QUIZ_TYPE_CONFIG.mcq.bg,
    border: QUIZ_TYPE_CONFIG.mcq.border,
  },
  {
    id: "openended" as const,
    label: QUIZ_TYPE_CONFIG.openended.label,
    icon: QUIZ_TYPE_CONFIG.openended.icon,
    color: QUIZ_TYPE_CONFIG.openended.color,
    bg: QUIZ_TYPE_CONFIG.openended.bg,
    border: QUIZ_TYPE_CONFIG.openended.border,
  },
  {
    id: "blanks" as const,
    label: QUIZ_TYPE_CONFIG.blanks.label,
    icon: QUIZ_TYPE_CONFIG.blanks.icon,
    color: QUIZ_TYPE_CONFIG.blanks.color,
    bg: QUIZ_TYPE_CONFIG.blanks.bg,
    border: QUIZ_TYPE_CONFIG.blanks.border,
  },
  {
    id: "code" as const,
    label: QUIZ_TYPE_CONFIG.code.label,
    icon: QUIZ_TYPE_CONFIG.code.icon,
    color: QUIZ_TYPE_CONFIG.code.color,
    bg: QUIZ_TYPE_CONFIG.code.bg,
    border: QUIZ_TYPE_CONFIG.code.border,
  },
  {
    id: "flashcard" as const,
    label: QUIZ_TYPE_CONFIG.flashcard.label,
    icon: QUIZ_TYPE_CONFIG.flashcard.icon,
    color: QUIZ_TYPE_CONFIG.flashcard.color,
    bg: QUIZ_TYPE_CONFIG.flashcard.bg,
    border: QUIZ_TYPE_CONFIG.flashcard.border,
  },
  {
    id: "ordering" as const,
    label: QUIZ_TYPE_CONFIG.ordering.label,
    icon: QUIZ_TYPE_CONFIG.ordering.icon,
    color: QUIZ_TYPE_CONFIG.ordering.color,
    bg: QUIZ_TYPE_CONFIG.ordering.bg,
    border: QUIZ_TYPE_CONFIG.ordering.border,
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
  const { cardPrimary, buttonSecondary } = getColorClasses()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [localQuestionCount, setLocalQuestionCount] = useState<[number, number]>([0, 50])
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const prevRangeRef = useRef<string>("")

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const rangeKey = `${questionCountRange[0]}-${questionCountRange[1]}`
    if (rangeKey !== prevRangeRef.current) {
      prevRangeRef.current = rangeKey
      setLocalQuestionCount(questionCountRange)
    }
  }, [questionCountRange[0], questionCountRange[1]])

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
          <Label className="text-sm font-black text-foreground">Quiz Types</Label>
          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedTypes.forEach(toggleQuizType)}
              className="h-8 px-3 text-xs font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-3 border-transparent hover:border-destructive/30 rounded-lg transition-all"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {quizTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id)
            const TypeIcon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => toggleQuizType(type.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl cursor-pointer group transition-all duration-200 border-3",
                  isSelected
                    ? "bg-primary/20 border-primary neo-shadow-primary hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    : "border-border hover:bg-muted/50 neo-shadow hover:neo-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px]",
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2.5 rounded-lg border-3 flex-shrink-0 neo-shadow", type.bg, type.border)}>
                    <TypeIcon className={cn("h-5 w-5", type.color)} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate">
                    {type.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="bg-border h-[3px]" />

      {/* Question Count Range */}
      {onQuestionCountChange && (
        <div className="space-y-4">
          <Label className="text-sm font-black text-foreground">Question Count</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={50}
              step={1}
              value={[localQuestionCount[0], localQuestionCount[1]]}
              onValueChange={handleQuestionCountChange}
              className="my-6"
            />
            <div className="flex justify-between items-center text-xs font-black text-muted-foreground">
              <span>{localQuestionCount[0]} min</span>
              <span>{localQuestionCount[1]} max</span>
            </div>
          </div>
        </div>
      )}

      {/* Public Only Toggle */}
      {onPublicOnlyChange && (
        <>
          <Separator className="bg-border h-[3px]" />
          <div
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border-3 border-border neo-shadow",
              "bg-muted/30",
            )}
          >
            <div className="space-y-1">
              <Label className="text-sm font-black text-foreground cursor-pointer">Public Only</Label>
              <p className="text-xs text-muted-foreground font-bold">Show only public templates</p>
            </div>
            <Switch checked={showPublicOnly} onCheckedChange={onPublicOnlyChange} />
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Fixed width, no overlap */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 space-y-4">
          <Card className={cn(cardPrimary, "rounded-xl")}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-foreground">Filter Quizzes</CardTitle>
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-black bg-primary/20 text-primary border-3 border-primary/30 neo-shadow px-3 py-1"
                  >
                    {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>{renderFilters()}</CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6 w-full">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={cn(buttonSecondary, "w-full justify-between h-14 px-5 rounded-xl")}
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5" strokeWidth={2.5} />
            <span>Filter Quizzes</span>
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="text-xs font-black bg-primary/20 text-primary border-3 border-primary/30 neo-shadow ml-2 px-3 py-1"
              >
                {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn("h-5 w-5 transition-transform", showMobileFilters && "rotate-180")}
            strokeWidth={2.5}
          />
        </Button>

        <Collapsible open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <CollapsibleContent>
            <Card className={cn("mt-4 rounded-xl", cardPrimary)}>
              <CardContent className="pt-6">{renderFilters()}</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  )
}

export const QuizSidebar = memo(QuizSidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.search === nextProps.search &&
    prevProps.isSearching === nextProps.isSearching &&
    prevProps.showPublicOnly === nextProps.showPublicOnly &&
    prevProps.selectedTypes.length === nextProps.selectedTypes.length &&
    prevProps.selectedTypes.every((type, index) => type === nextProps.selectedTypes[index]) &&
    prevProps.questionCountRange?.[0] === nextProps.questionCountRange?.[0] &&
    prevProps.questionCountRange?.[1] === nextProps.questionCountRange?.[1]
  )
})
