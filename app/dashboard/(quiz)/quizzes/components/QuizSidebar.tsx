import type React from "react"
import { useEffect, useState, memo, useCallback, useRef } from "react"
import { 
  FileQuestion, 
  AlignJustify, 
  PenTool, 
  Code, 
  Filter, 
  X, 
  ChevronDown, 
  Flashlight, 
  Search, 
  Target,
  Brain,
  Hash,
  Lightbulb,
  Settings,
  SlidersHorizontal,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { QuizType } from "@/app/types/quiz-types"
import { cn } from "@/lib/utils"

const quizTypes = [
  { 
    id: "mcq" as const, 
    label: "Multiple Choice", 
    icon: Target, 
    color: "text-blue-600 dark:text-blue-400",
    description: "Choose the correct answer from options",
    bgColor: "bg-blue-50/60 dark:bg-blue-950/30",
  },
  {
    id: "openended" as const,
    label: "Open Ended",
    icon: Brain,
    color: "text-emerald-600 dark:text-emerald-400",
    description: "Write your own answer in detail",
    bgColor: "bg-emerald-50/60 dark:bg-emerald-950/30",
  },
  { 
    id: "blanks" as const, 
    label: "Fill Blanks", 
    icon: PenTool, 
    color: "text-amber-600 dark:text-amber-400",
    description: "Complete the missing words or code",
    bgColor: "bg-amber-50/60 dark:bg-amber-950/30",
  },
  { 
    id: "code" as const, 
    label: "Code", 
    icon: Code, 
    color: "text-purple-600 dark:text-purple-400",
    description: "Write and test programming solutions",
    bgColor: "bg-purple-50/60 dark:bg-purple-950/30",
  },
  { 
    id: "flashcard" as const, 
    label: "Flash Cards", 
    icon: Lightbulb, 
    color: "text-orange-600 dark:text-orange-400",
    description: "Review key concepts and terms",
    bgColor: "bg-orange-50/60 dark:bg-orange-950/30",
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
        // Clear previous timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
        // Set new timer
        debounceTimer.current = setTimeout(() => {
          onQuestionCountChange?.([value[0], value[1]])
        }, 300)
      }
    },
    [onQuestionCountChange],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const hasActiveFilters = selectedTypes.length > 0 || search.length > 0 || showPublicOnly

  const renderFilters = () => (
    <div className="space-y-8">
      {/* Enhanced Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-foreground">Search Quizzes</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search by quiz title, description, or keywords</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, description..."
            value={search}
            onChange={onSearchChange}
            className="pl-12 pr-12 bg-background/80 border-border/60 focus:border-primary/60 focus:ring-primary/20 transition-all duration-300 h-12 text-sm"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/80 hover:text-muted-foreground transition-all duration-200 rounded-full"
              onClick={onClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

      {/* Enhanced Quiz Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-foreground bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Quiz Types</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter quizzes by question format</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedTypes.forEach(toggleQuizType)}
              className="h-7 px-3 text-xs hover:bg-muted/80 hover:text-muted-foreground transition-all duration-200 rounded-lg"
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {quizTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id)
            const TypeIcon = type.icon
            return (
              <TooltipProvider key={type.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleQuizType(type.id)}
                      className={cn(
                        "justify-start gap-3 h-12 transition-all duration-300 hover:scale-[1.02]",
                        isSelected 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 border-0" 
                          : "bg-background/60 border-border/60 hover:bg-accent/80 hover:text-accent-foreground hover:border-primary/30"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", isSelected ? "bg-primary-foreground/20" : type.bgColor)}>
                        <TypeIcon className={cn("h-4 w-4", isSelected ? "text-primary-foreground" : type.color)} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{type.label}</div>
                        <div className="text-xs opacity-70">{type.description}</div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5 bg-primary-foreground/20 text-primary-foreground border-0">
                          ✓
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </div>

      {/* Enhanced Question Count Range */}
      {onQuestionCountChange && (
        <>
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Question Count</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter quizzes by number of questions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="px-3">
              <Slider
                min={0}
                max={50}
                step={1}
                value={[localQuestionCount[0], localQuestionCount[1]]}
                onValueChange={handleQuestionCountChange}
                className="my-8"
              />
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-sm font-bold text-primary">{localQuestionCount[0]}</div>
                  <div className="text-xs text-muted-foreground">Min</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-primary">{localQuestionCount[1]}</div>
                  <div className="text-xs text-muted-foreground">Max</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Public Only Toggle */}
      {onPublicOnlyChange && (
        <>
          <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center justify-between p-5 bg-accent/30 rounded-xl border border-border/50 hover:bg-accent/40 transition-colors duration-300">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-foreground">Public Quizzes Only</Label>
              <p className="text-xs text-muted-foreground">Show only publicly available quizzes</p>
            </div>
            <Switch 
              checked={showPublicOnly} 
              onCheckedChange={onPublicOnlyChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 shrink-0">
        <Card className="sticky top-6 bg-background/95 backdrop-blur-sm border-border/50 shadow-xl shadow-primary/5">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                <div className="p-2.5 bg-primary rounded-xl shadow-lg">
                  <Filter className="h-5 w-5 text-primary-foreground" />
                </div>
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground px-2.5 py-1 shadow-sm">
                  {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)} active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">{renderFilters()}</CardContent>
        </Card>
      </div>

      {/* Enhanced Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full justify-between bg-background/95 backdrop-blur-sm border-border/60 shadow-lg hover:bg-accent/80 hover:border-primary/30 transition-all duration-300 h-12"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg shadow-sm">
              <Filter className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground px-2 py-0.5">
                {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showMobileFilters && "rotate-180")} />
        </Button>

        <Collapsible open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <CollapsibleContent>
            <Card className="mt-4 bg-background/95 backdrop-blur-sm border-border/50 shadow-xl">
              <CardContent className="pt-6 space-y-8">{renderFilters()}</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Enhanced Mobile Filter Overlay */}
      <AnimatePresence>
        {showMobileFilters && !isDesktop && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              className="fixed bottom-0 inset-x-0 bg-background/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-white/20 dark:border-gray-700/30 rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto lg:hidden shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg">
                      <Filter className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Filter Quizzes
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMobileFilters(false)}
                    className="h-10 w-10 p-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {renderFilters()}
                <div className="flex gap-3 mt-8 pt-6 border-t border-white/20 dark:border-gray-700/30">
                  <Button 
                    variant="outline" 
                    onClick={onClearSearch} 
                    className="flex-1 bg-background/50 border-border/50 hover:bg-muted/80 hover:text-muted-foreground hover:border-border transition-all duration-300 h-12"
                  >
                    Clear All
                  </Button>
                  <Button 
                    onClick={() => setShowMobileFilters(false)} 
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 border-0 hover:scale-105 transition-all duration-300 h-12 font-semibold"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export const QuizSidebar = memo(QuizSidebarComponent)


