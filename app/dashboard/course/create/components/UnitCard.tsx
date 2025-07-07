"use client"

import React from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droppable } from "react-beautiful-dnd"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import type { Chapter, CourseUnit } from "@prisma/client"

interface UnitCardProps {
  unit: CourseUnit
  unitIndex: number
  chapters: Chapter[]
}

export default function UnitCard({ unit, unitIndex, chapters }: UnitCardProps) {
  const unitId = `unit-${unit.id}`

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-start">
          <span className="mr-2">Unit {unitIndex + 1}:</span>
          <span>{unit.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={unitId} type="chapter">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "space-y-3 min-h-[50px] transition-colors rounded-md",
                snapshot.isDraggingOver && "bg-muted/50"
              )}
            >
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="bg-card border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <span className="font-medium">{chapter.title}</span>
                    </div>
                    {chapter.videoId && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Preview Video
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  )
}
