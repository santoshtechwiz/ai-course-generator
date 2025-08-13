'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Lock, Eye, Settings, RotateCcw, RotateCw, Heart, Share2, Download, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Video } from '@/hooks/useCourseData'

interface VideoPlayerProps {
  video: Video
  isLocked: boolean
  onVideoEnd: () => void
  onTimeUpdate?: (currentTime: number) => void
}

export function VideoPlayer({ video, isLocked, onVideoEnd, onTimeUpdate }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showEngagement, setShowEngagement] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onVideoEnd()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onVideoEnd])

  useEffect(() => {
    if (isLocked) {
      setIsPlaying(false)
    }
  }, [isLocked])

  const togglePlay = () => {
    if (isLocked) return
    
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
    }
    setShowSettings(false)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    setShowEngagement(true)
    setTimeout(() => setShowEngagement(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Check out this video: ${video.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShowEngagement(true)
      setTimeout(() => setShowEngagement(false), 2000)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden shadow-2xl transition-all duration-300",
        isTheaterMode ? "rounded-none" : "rounded-xl",
        isFullscreen ? "fixed inset-0 z-50" : ""
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        poster={video.thumbnail}
        preload="metadata"
        muted={isMuted}
      >
        <source src={video.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="text-center text-white">
            <Lock className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-semibold mb-2">Video Locked</h3>
            <p className="text-gray-300 mb-4">Subscribe to unlock this video and access the full course</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            disabled={isLocked}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLocked}
              className={cn(
                "p-2 rounded-full transition-colors",
                isLocked 
                  ? "text-gray-500 cursor-not-allowed" 
                  : "text-white hover:bg-white/20"
              )}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-32">
                  <div className="text-white text-xs mb-2">Playback Speed</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={cn(
                        "block w-full text-left px-2 py-1 text-sm rounded hover:bg-white/20 transition-colors",
                        playbackRate === rate ? "text-blue-400" : "text-white"
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Button */}
            <button
              onClick={toggleTheaterMode}
              className={cn(
                "p-2 rounded-full transition-colors",
                isTheaterMode 
                  ? "text-blue-400 bg-blue-400/20" 
                  : "text-white hover:bg-white/20"
              )}
            >
              <BookOpen className="w-5 h-5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Title Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
          <h2 className="text-lg font-semibold">{video.title}</h2>
          <p className="text-sm text-gray-300 mt-1">{video.duration}</p>
        </div>
      </div>

      {/* Engagement Buttons */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {/* Preview Indicator for Locked Videos */}
        {isLocked && (
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            isLiked 
              ? "bg-red-500 text-white" 
              : "bg-black/50 text-white hover:bg-black/70"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Download Button */}
        <button className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Engagement Feedback */}
      {showEngagement && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium animate-bounce">
            {isLiked ? "Added to favorites!" : "Removed from favorites"}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}