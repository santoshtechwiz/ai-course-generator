import type React from "react"
import { useEffect, useState, memo, useCallback } from "react"
import { FileQuestion, AlignJustify, PenTool, Code, Filter, X, ChevronDown, Flashlight, Search } from "lucide-react"
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
import type { QuizType } from "@/app/types/quiz-types"
import { cn } from "@/lib/utils"

const quizTypes = [
  { id: "mcq" as const, label: "Multiple Choice", icon: FileQuestion, color: "text-blue-600 dark:text-blue-400" },
  {
    id: "openended" as const,
    label: "Open Ended",
    icon: AlignJustify,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  { id: "blanks" as const, label: "Fill Blanks", icon: PenTool, color: "text-amber-600 dark:text-amber-400" },
  { id: "code" as const, label: "Code", icon: Code, color: "text-purple-600 dark:text-purple-400" },
  { id: "flashcard" as const, label: "Flash Cards", icon: Flashlight, color: "text-pink-600 dark:text-pink-400" },
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
        const timer = setTimeout(() => {
          onQuestionCountChange?.([value[0], value[1]])
        }, 300)
        return () => clearTimeout(timer)
      }
    },
    [onQuestionCountChange],
  )

  const hasActiveFilters = selectedTypes.length > 0 || search.length > 0 || showPublicOnly

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Search Quizzes</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title..."
            value={search}
            onChange={onSearchChange}
            className="pl-10 pr-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-white/30 dark:border-gray-700/30 focus:border-blue-500/50 transition-all duration-300"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-600 transition-all duration-200"
              onClick={onClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

      {/* Quiz Types */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Quiz Types</Label>
          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedTypes.forEach(toggleQuizType)}
              className="h-6 px-2 text-xs hover:bg-red-500/10 hover:text-red-600 transition-all duration-200"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {quizTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id)
            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleQuizType(type.id)}
                className={cn(
                  "justify-start gap-2 h-10 transition-all duration-300 hover:scale-105",
                  isSelected 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-0" 
                    : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-white/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80"
                )}
              >
                <type.icon className={cn("h-4 w-4", isSelected ? "text-white" : type.color)} />
                <span className="text-sm font-medium">{type.label}</span>
                {isSelected && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 bg-white/20 text-white border-0">
                    ✓
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Question Count Range */}
      {onQuestionCountChange && (
        <>
          <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div className="space-y-4">
            <Label className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Question Count</Label>
            <div className="px-2">
              <Slider
                min={0}
                max={50}
                step={1}
                value={[localQuestionCount[0], localQuestionCount[1]]}
                onValueChange={handleQuestionCountChange}
                className="my-6"
              />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-600 dark:text-blue-400">{localQuestionCount[0]} questions</span>
                <span className="text-purple-600 dark:text-purple-400">{localQuestionCount[1]} questions</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Public Only Toggle */}
      {onPublicOnlyChange && (
        <>
          <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          <div className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">Public Quizzes Only</Label>
              <p className="text-xs text-muted-foreground">Show only publicly available quizzes</p>
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
        <Card className="sticky top-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl shadow-black/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                  {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)} active
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
          className="w-full justify-between bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Filter className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                {selectedTypes.length + (search ? 1 : 0) + (showPublicOnly ? 1 : 0)}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", showMobileFilters && "rotate-180")} />
        </Button>

        <Collapsible open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <CollapsibleContent>
            <Card className="mt-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
              <CardContent className="pt-6">{renderFilters()}</CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mobile Filter Overlay */}
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
              className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-t border-white/20 dark:border-gray-700/30 rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto lg:hidden shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <Filter className="h-4 w-4 text-white" />
                    </div>
                    Filter Quizzes
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMobileFilters(false)}
                    className="h-10 w-10 p-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-300 hover:scale-105"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {renderFilters()}
                <div className="flex gap-3 mt-6 pt-6 border-t border-white/20 dark:border-gray-700/30">
                  <Button 
                    variant="outline" 
                    onClick={onClearSearch} 
                    className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-white/30 dark:border-gray-700/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-all duration-300"
                  >
                    Clear All
                  </Button>
                  <Button 
                    onClick={() => setShowMobileFilters(false)} 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 border-0 hover:scale-105 transition-all duration-300"
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


