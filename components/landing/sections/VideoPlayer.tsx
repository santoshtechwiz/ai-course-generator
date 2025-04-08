"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react"

// Optimize the video player component with better state management and accessibility
const VideoPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Handle click on progress bar to seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      const newTime = clickPosition * videoRef.current.duration

      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress((newTime / videoRef.current.duration) * 100)
    }
  }

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      setCurrentTime(video.currentTime)
      setProgress((video.currentTime / video.duration) * 100)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener("timeupdate", updateProgress)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      video.removeEventListener("timeupdate", updateProgress)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when the video player is focused
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (e.key) {
        case " ":
        case "k":
          togglePlay()
          e.preventDefault()
          break
        case "m":
          toggleMute()
          e.preventDefault()
          break
        case "f":
          toggleFullscreen()
          e.preventDefault()
          break
        case "ArrowRight":
          if (videoRef.current) {
            videoRef.current.currentTime += 5
            e.preventDefault()
          }
          break
        case "ArrowLeft":
          if (videoRef.current) {
            videoRef.current.currentTime -= 5
            e.preventDefault()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
      aria-label="Video player"
      role="application"
    >
      {/* Placeholder video - in a real implementation, you would use a real video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        poster="/placeholder.svg?height=1080&width=1920"
        aria-label="Course demonstration video"
      >
        <source src="https://example.com/demo-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center"
              whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <Play className="h-8 w-8 ml-1" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar with improved interaction */}
      <div
        ref={progressBarRef}
        className="absolute bottom-14 left-0 right-0 h-1 bg-black/20 cursor-pointer"
        onClick={handleProgressClick}
        role="progressbar"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ type: "tween" }} />
      </div>

      {/* Time display */}
      <div
        className={`absolute bottom-14 left-0 right-0 px-4 flex justify-between text-xs text-white/80 transition-opacity duration-300 ${
          isHovering || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isHovering || !isPlaying ? 1 : 0,
          y: isHovering || !isPlaying ? 0 : 10,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-2">
          <motion.button
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.7)" }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </motion.button>

          <motion.button
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.7)" }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </motion.button>
        </div>

        <motion.button
          className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.7)" }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </motion.button>
      </motion.div>
    </div>
  )
}

export default VideoPlayer
