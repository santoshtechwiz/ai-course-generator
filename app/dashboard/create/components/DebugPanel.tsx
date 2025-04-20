"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DebugPanelProps {
  editingChapterId: string | null
  showVideoDialog: boolean
  currentVideoId: string | null
  addingToUnitId: string | null
  completedChapters: Set<string>
  totalChaptersCount: number
}

const DebugPanel = ({
  editingChapterId,
  showVideoDialog,
  currentVideoId,
  addingToUnitId,
  completedChapters,
  totalChaptersCount,
}: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-orange-400 border-2">
        <CardHeader className="py-2 px-4 bg-orange-100 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Debug Panel</span>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-3 text-xs space-y-2 bg-white">
            <div className="grid grid-cols-2 gap-1">
              <div className="font-semibold">Editing Chapter:</div>
              <div className="truncate">{editingChapterId || "None"}</div>

              <div className="font-semibold">Video Dialog:</div>
              <div>{showVideoDialog ? "Open" : "Closed"}</div>

              <div className="font-semibold">Current Video:</div>
              <div className="truncate">{currentVideoId || "None"}</div>

              <div className="font-semibold">Adding to Unit:</div>
              <div className="truncate">{addingToUnitId || "None"}</div>

              <div className="font-semibold">Completed:</div>
              <div>
                {completedChapters.size} / {totalChaptersCount}
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="font-semibold mb-1">Completed Chapters:</div>
              <div className="max-h-20 overflow-y-auto">
                {Array.from(completedChapters).length > 0 ? (
                  Array.from(completedChapters).map((id) => (
                    <div key={id} className="truncate text-xs text-gray-600">
                      {id}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">None</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() =>
                  console.log({
                    editingChapterId,
                    showVideoDialog,
                    currentVideoId,
                    addingToUnitId,
                    completedChapters: Array.from(completedChapters),
                    totalChaptersCount,
                  })
                }
              >
                Log to Console
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default DebugPanel
