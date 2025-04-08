"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

const VideoPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  return (
    <div
      className="relative w-full aspect-video rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Placeholder video - in a real implementation, you would use a real video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        poster="/placeholder.svg?height=1080&width=1920"
      >
        <source src="https://example.com/demo-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 1 }}
        animate={{ opacity: isPlaying ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isPlaying ? "none" : "auto" }}
      >
        <motion.button
          className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
        >
          <Play className="h-8 w-8 ml-1" />
        </motion.button>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovering || !isPlaying ? 1 : 0, y: isHovering || !isPlaying ? 0 : 10 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </motion.button>

        <motion.button
          className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </motion.button>
      </motion.div>
    </div>
  )
}

export default VideoPlayer
