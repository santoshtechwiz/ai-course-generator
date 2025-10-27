"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Bug, RotateCcw } from "lucide-react"

interface VideoDebugProps {
  videoId: string | null
  courseId?: string | number | null
  chapterId?: string | null
}

export function VideoDebug({ 
  videoId, 
  courseId, 
  chapterId,
}: VideoDebugProps) {
  // Only render in development mode
  if (process.env.NODE_ENV === 'production') return null;

  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Simplified debugging info - fetch directly when needed
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const courseIdStr = courseId ? String(courseId) : null;
      
      // Get stored progress from localStorage
      let videoProgress = null;
      let courseProgress = null;
      
      if (videoId) {
        try {
          const storedVideoProgress = localStorage.getItem(`video-progress-${videoId}`);
          if (storedVideoProgress) {
            videoProgress = JSON.parse(storedVideoProgress);
          }
        } catch (e) {
          console.warn('Failed to parse video progress', e);
        }
      }
      
      setDebugInfo({
        currentTime: new Date().toLocaleTimeString(),
        videoId,
        courseId: courseIdStr,
        chapterId,
        hasVideoProgress: !!videoProgress,
        progress: videoProgress?.played || 0,
      });
    } catch (err) {
      console.error("Debug info error:", err);
      setDebugInfo({ error: "Failed to get debug info" });
    }
  }, [isOpen, videoId, courseId, chapterId]);

  // Clear state helper
  const clearState = () => {
    try {
      // Clear all video progress data
      const keys = Object.keys(localStorage);
      const videoProgressKeys = keys.filter(key => 
        key.startsWith('video-progress-') || 
        key.includes('-certificate-prompted-') ||
        key.includes('-restart-prompted-')
      );
      
      videoProgressKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      sessionStorage.removeItem('video-guest-id');
      alert('Video state cleared. The page will reload.');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error("Failed to clear state:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md text-white">
      <div className="bg-black/80 rounded-none shadow-lg overflow-hidden">
        <button 
          onClick={() => setIsOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm bg-blue-900/80 hover:bg-blue-800/80"
        >
          <div className="flex items-center gap-2">
            <Bug size={14} />
            <span>Debug</span>
          </div>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {isOpen && debugInfo && (
          <div className="p-4 space-y-3 text-xs max-h-80 overflow-auto">
            {/* Simplified debug info display */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-gray-400">Video ID:</div>
              <div className="font-mono">{debugInfo.videoId || 'null'}</div>
              <div className="text-gray-400">Course ID:</div>
              <div className="font-mono">{debugInfo.courseId || 'null'}</div>
              <div className="text-gray-400">Progress:</div>
              <div>{debugInfo.progress ? `${Math.round(debugInfo.progress * 100)}%` : '0%'}</div>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={clearState}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
              >
                <RotateCcw size={12} />
                <span>Reset Progress</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
