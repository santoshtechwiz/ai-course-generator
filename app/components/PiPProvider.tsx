"use client";

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setPiPActive, setPiPVideoData } from '@/store/slices/course-slice';
import { setVideoProgress as setCourseVideoProgress } from '@/store/slices/courseProgress-slice';
import DraggablePiPPlayer from '../dashboard/course/[slug]/components/video/components/DraggablePiPPlayer';
import VideoPlayer from '../dashboard/course/[slug]/components/video/components/VideoPlayer';

const PiPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isPiPActive, pipVideoData } = useAppSelector((state) => state.course);

  const handlePiPClose = () => {
    // Before closing PiP, save the current progress to course progress
    if (pipVideoData?.currentTime && pipVideoData.currentTime > 0) {
      // Update course progress with the current PiP time
      dispatch(setCourseVideoProgress({
        courseId: pipVideoData.courseId || '',
        chapterId: Number(pipVideoData.chapterId || 0),
        progress: 0, // We don't have progress percentage, just time
        playedSeconds: pipVideoData.currentTime,
        completed: false,
        userId: 'current' // Will be handled by the progress system
      }));
    }

    dispatch(setPiPActive(false));
    dispatch(setPiPVideoData(undefined));
  };

  const handlePiPProgress = (state: { played: number; loaded: number; playedSeconds: number; shouldMarkCompleted?: boolean }) => {
    // Update Redux store with PiP video progress
    if (pipVideoData) {
      // Update course progress
      dispatch(setCourseVideoProgress({
        courseId: pipVideoData.courseId || '',
        chapterId: Number(pipVideoData.chapterId || 0),
        progress: state.played * 100,
        playedSeconds: state.playedSeconds,
        completed: false,
        userId: 'current'
      }));

      // Update PiP data with current time for when it closes
      dispatch(setPiPVideoData({
        ...pipVideoData,
        currentTime: state.playedSeconds
      }));
    }
  };

  return (
    <>
      {children}
      {/* Global PiP Player */}
      {isPiPActive && pipVideoData && (
        <DraggablePiPPlayer
          isActive={true}
          onClose={handlePiPClose}
          onMaximize={handlePiPClose}
          playing={false} // Will be controlled by the VideoPlayer
          onPlayPause={() => {}} // Will be handled by VideoPlayer
          currentTime="0:00"
          duration="0:00"
        >
          <VideoPlayer
            youtubeVideoId={pipVideoData.youtubeVideoId}
            chapterId={pipVideoData.chapterId}
            courseId={pipVideoData.courseId}
            courseName={pipVideoData.courseName}
            chapterTitle={pipVideoData.chapterTitle}
            initialSeekSeconds={pipVideoData.currentTime}
            isCustomPiPActive={true}
            onPictureInPictureToggle={handlePiPClose}
            onProgress={handlePiPProgress}
          />
        </DraggablePiPPlayer>
      )}
    </>
  );
};

export default PiPProvider;