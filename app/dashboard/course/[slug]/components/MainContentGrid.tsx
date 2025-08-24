"use client"

import React from 'react'
import { motion } from 'framer-motion'
import VideoPlayer from './video/components/VideoPlayer'
import PlaylistSidebar from './PlaylistSidebar'
import CourseDetailsTabs from './CourseDetailsTabs'
import type { FullCourseType, FullChapterType } from '@/app/types/types'
import type { BookmarkData } from './video/types'
import type { AccessLevels } from './CourseDetailsTabs'

interface MainContentGridProps {
  course: FullCourseType
  currentChapter?: FullChapterType | null
  currentVideoId?: string | null
  bookmarkItems: BookmarkData[]
  videoPlaylist: any[]
  currentIndex: number
  isLastVideo: boolean
  courseStats: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
  accessLevels: AccessLevels
  courseProgress: any
  
  // Handlers
  onVideoProgress: (state: { played: number, playedSeconds: number }) => void
  onVideoEnded: () => void
  onVideoLoad: (duration: number) => void
  onPlayerReady: (ref: any) => void
  onPictureInPictureToggle: (active: boolean) => void
  onChapterSelect: (chapterId: string | number) => void
  onNextVideo: () => void
  onPreviousVideo: () => void
}

const MainContentGrid: React.FC<MainContentGridProps> = ({
  course,
  currentChapter,
  currentVideoId,
  bookmarkItems,
  videoPlaylist,
  currentIndex,
  isLastVideo,
  courseStats,
  accessLevels,
  courseProgress,
  onVideoProgress,
  onVideoEnded,
  onVideoLoad,
  onPlayerReady,
  onPictureInPictureToggle,
  onChapterSelect,
  onNextVideo,
  onPreviousVideo
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
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 xl:max-w-[1400px] mx-auto w-full"> 
      {/* Left column: Video and tabs */}
      <motion.div 
        key="video-content"
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-w-0 order-2 xl:order-1"
      >
        {/* Video player component */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
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

        {/* Course details tabs */}
        <div className="mt-6">
          <CourseDetailsTabs
            course={course}
            currentChapter={currentChapter}
            accessLevels={accessLevels}
            courseStats={courseStats}
          />
        </div>
      </motion.div>

      {/* Right column: Playlist sidebar */}
      <motion.div 
        key="playlist-sidebar"
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="order-1 xl:order-2 hidden xl:block"
      >
        <PlaylistSidebar
          course={course}
          videoPlaylist={videoPlaylist}
          currentIndex={currentIndex}
          onChapterSelect={onChapterSelect}
          onNextVideo={onNextVideo}
          onPreviousVideo={onPreviousVideo}
          isLastVideo={isLastVideo}
        />
      </motion.div>
    </div>
  )
}

export default React.memo(MainContentGrid)