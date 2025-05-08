"use client"

import { useQuiz } from "@/app/context/QuizContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

export function QuizStateDisplay() {
  const { state } = useQuiz()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardHeader className="p-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-sm text-slate-700">Quiz State</CardTitle>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-3 pt-0">
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(state, null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}
