'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Chapter {
  id: number
  name: string
  youtubeSearchQuery: string
}

interface ChapterModalProps {
  recommendation: {
    courseId: number
    slug: string | null
    chapterId?: number
  }
  onClose: () => void
}

export default function ChapterModal({ recommendation, onClose }: ChapterModalProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`/api/course/${recommendation.courseId}/chapters`)
        const data = await response.json()
        setChapters(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching chapters:', error)
        setLoading(false)
      }
    }

    fetchChapters()
  }, [recommendation.courseId])

  const handleChapterSelect = (chapter: Chapter) => {
    if (recommendation.slug) {
      router.push(`/course/${recommendation.slug}?chapter=${chapter.id}`)
    } else {
      router.push(`/course/${recommendation.courseId}/chapter/${chapter.id}`)
    }
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a Chapter</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))
          ) : (
            chapters.map((chapter) => (
              <Button
                key={chapter.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleChapterSelect(chapter)}
              >
                {chapter.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
