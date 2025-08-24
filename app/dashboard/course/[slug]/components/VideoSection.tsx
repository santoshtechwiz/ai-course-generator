"use client"

import React from 'react'
import VideoPlayer from '../video/components/VideoPlayer'
import CourseDetailsTabs from '../CourseDetailsTabs'
import ReviewsSection from '../ReviewsSection'
import type { FullCourseType, FullChapterType } from '@/app/types/types'
import type { BookmarkData } from '../video/types'
import type { AccessLevels } from '../CourseDetailsTabs'

interface VideoSectionProps {
  course: FullCourseType
  currentChapter?: FullChapterType | null
  currentVideoId?: string | null
  bookmarkItems: BookmarkData[]
  isLastVideo: boolean
  courseStats: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
  accessLevels: AccessLevels
  courseProgress: any
  
  // Video handlers
  onVideoProgress: (state: { played: number, playedSeconds: number }) => void
  onVideoEnded: () => void
  onVideoLoad: (duration: number) => void
  onPlayerReady: (ref: any) => void
  onPictureInPictureToggle: (active: boolean) => void
  onSeekToBookmark?: (time: number, title?: string) => void
}

const VideoSection: React.FC<VideoSectionProps> = ({
  course,
  currentChapter,
  currentVideoId,
  bookmarkItems,
  isLastVideo,
  courseStats,
  accessLevels,
  courseProgress,
  onVideoProgress,
  onVideoEnded,
  onVideoLoad,
  onPlayerReady,
  onPictureInPictureToggle,
  onSeekToBookmark
}) => {
  const initialSeekSeconds = (() => {
    try {
      if (courseProgress?.videoProgress?.playedSeconds && 
          String(courseProgress.videoProgress.currentChapterId) === String(currentChapter?.id)) {
        const ts = Number(courseProgress.videoProgress.playedSeconds)
        if (!isNaN(ts) && ts > 0) return ts
      }
    } catch {}
    return undefined
  })()

  return (
    <div className="space-y-6">
      {/* Video player */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        <VideoPlayer 
          youtubeVideoId={currentVideoId || ''}
          chapterId={currentChapter?.id?.toString()}
          chapterTitle={currentChapter?.title || ''}
          bookmarks={bookmarkItems}
          onProgress={onVideoProgress}
          onEnded={onVideoEnded}
          onVideoLoad={onVideoLoad}
          onPlayerReady={onPlayerReady}
          onPictureInPictureToggle={onPictureInPictureToggle}
          initialSeekSeconds={initialSeekSeconds}
          isLastVideo={isLastVideo}
        />
      </div>

      {/* Course details tabs with improved styling */}
      <div className="rounded-xl border bg-card shadow-sm min-h-[500px]">
        <CourseDetailsTabs
          course={course}
          currentChapter={currentChapter}
          accessLevels={accessLevels}
          courseStats={courseStats}
          onSeekToBookmark={onSeekToBookmark}
        />
      </div>

      {/* Reviews section */}
      <ReviewsSection slug={course.slug} />
    </div>
  )
}

export default React.memo(VideoSection)