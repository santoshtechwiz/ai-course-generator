import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Filter, Search } from "lucide-react"

interface ReviewControlsProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
  filterType: string
  setFilterType: (value: string) => void
  showAllQuestions: boolean
  setShowAllQuestions: (v: boolean) => void
}

export function ReviewControls({
  searchQuery, setSearchQuery, filterType, setFilterType, showAllQuestions, setShowAllQuestions
}: ReviewControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-muted/20 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="correct">Correct Only</SelectItem>
            <SelectItem value="incorrect">Incorrect Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={showAllQuestions ? "default" : "outline"}
          onClick={() => setShowAllQuestions(true)}
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          All Questions
        </Button>
        <Button
          variant={!showAllQuestions ? "default" : "outline"}
          onClick={() => setShowAllQuestions(false)}
          size="sm"
        >
          <EyeOff className="w-4 h-4 mr-2" />
          One by One
        </Button>
      </div>
    </div>
  )
}
