"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Loader2,
  Repeat,
  Download,
  List,
  Share2,
} from "lucide-react"
import { formatTime, getVideoQualityOptions, PLAYBACK_SPEEDS } from "@/lib/utils"
import Logo from "@/app/components/shared/Logo"
import { Document, Page, Text, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2980B9",
  },
  content: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#34495E",
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#E74C3C",
  },
  courseName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#27AE60",
  },
  date: {
    fontSize: 14,
    marginTop: 30,
    textAlign: "center",
    color: "#7F8C8D",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#7F8C8D",
    fontSize: 10,
  },
})

// Certificate component
const Certificate = ({ userName, courseName }: { userName: string; courseName: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src="/path/to/courseai-logo.png" style={styles.logo} />
      <Text style={styles.header}>Certificate of Completion</Text>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.content}>This is to certify that</Text>
      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.content}>has successfully completed the course</Text>
      <Text style={styles.courseName}>{courseName}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      <Text style={styles.footer}>
        This certificate is proudly presented by CourseAI Verify this certificate at: https://courseai.com/verify
      </Text>
    </Page>
  </Document>
)

interface VideoPlayerProps {
  videoId: string
  onEnded: () => void
  autoPlay?: boolean
  onProgress?: (progress: number) => void
  initialTime?: number
  brandLogo?: React.ReactNode
  isLastVideo?: boolean
  courseAIVideos?: { id: string; title: string }[]
  onDownloadCertificate?: () => void
  playerConfig?: {
    showRelatedVideos?: boolean
    rememberPosition?: boolean
    rememberMute?: boolean
    showCertificateButton?: boolean
  }
  onVideoSelect: (videoId: string) => void
  courseName: string
}

const EnhancedVideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onEnded,
  autoPlay = false,
  onProgress,
  initialTime = 0,
  brandLogo = <Logo />,
  isLastVideo = false,
  courseAIVideos = [],
  onDownloadCertificate,
  playerConfig = {
    showRelatedVideos: false,
    rememberPosition: true,
    rememberMute: true,
    showCertificateButton: false,
  },
  onVideoSelect,
  courseName,
}) => {
  const [playing, setPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [quality, setQuality] = useState("auto")
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [showCertificateOverlay, setShowCertificateOverlay] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showCourseAIVideos, setShowCourseAIVideos] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  useEffect(() => {
    setPlaying(autoPlay)
    setPlayed(0)
    if (playerRef.current) {
      playerRef.current.seekTo(0)
    }
  }, [autoPlay])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") handlePlayPause()
      if (e.key === "ArrowLeft") handleSkip(-10)
      if (e.key === "ArrowRight") handleSkip(10)
      if (e.key === "m") handleMute()
      if (e.key === "f") handleFullscreen()
    }
    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  useEffect(() => {
    if (playerConfig.rememberPosition) {
      const savedPosition = localStorage.getItem(`video-position-${videoId}`)
      if (savedPosition) {
        setPlayed(Number.parseFloat(savedPosition))
        playerRef.current?.seekTo(Number.parseFloat(savedPosition))
      }
    }
    if (playerConfig.rememberMute) {
      const savedMute = localStorage.getItem(`video-mute-${videoId}`)
      const savedVolume = localStorage.getItem(`video-volume-${videoId}`)
      if (savedMute) {
        setMuted(savedMute === "true")
      }
      if (savedVolume) {
        setVolume(Number.parseFloat(savedVolume))
      }
    }
  }, [videoId, playerConfig.rememberPosition, playerConfig.rememberMute])

  const handlePlayPause = () => setPlaying(!playing)
  const handleMute = () => {
    const newMutedState = !muted
    setMuted(newMutedState)
    setVolume(newMutedState ? 0 : 0.8)
    if (playerConfig.rememberMute) {
      localStorage.setItem(`video-mute-${videoId}`, newMutedState.toString())
      localStorage.setItem(`video-volume-${videoId}`, newMutedState ? "0" : "0.8")
    }
  }
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0]
    setVolume(volumeValue)
    setMuted(volumeValue === 0)
    if (playerConfig.rememberMute) {
      localStorage.setItem(`video-mute-${videoId}`, (volumeValue === 0).toString())
      localStorage.setItem(`video-volume-${videoId}`, volumeValue.toString())
    }
  }
  const handleSeekChange = (newPlayed: number[]) => {
    setPlayed(newPlayed[0])
    playerRef.current?.seekTo(newPlayed[0])
    if (playerConfig.rememberPosition) {
      localStorage.setItem(`video-position-${videoId}`, newPlayed[0].toString())
    }
  }
  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number }) => {
    if (!playerRef.current?.getInternalPlayer()?.seeking) {
      setPlayed(state.played)
      onProgress?.(state.played)
      if (playerConfig.rememberPosition) {
        localStorage.setItem(`video-position-${videoId}`, state.played.toString())
      }
    }
  }
  const handleDuration = (duration: number) => setDuration(duration)
  const handleSkip = (seconds: number) => {
    const newTime = (playerRef.current?.getCurrentTime() || 0) + seconds
    playerRef.current?.seekTo(newTime / duration)
  }
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }
  const handleQualityChange = (newQuality: string) => setQuality(newQuality)
  const handlePlaybackSpeedChange = (newSpeed: number) => setPlaybackSpeed(newSpeed)

  const handleReady = () => {
    const player = playerRef.current?.getInternalPlayer()
    if (player && player.getAvailableQualityLevels) {
      setAvailableQualities(player.getAvailableQualityLevels())
    }
  }

  const handleVideoEnd = () => {
    if (isLastVideo) {
      setShowCertificateOverlay(true)
    } else if (playerConfig.showRelatedVideos) {
      setShowCourseAIVideos(true)
    } else {
      onEnded()
    }
  }

  const handleBuffer = () => setIsBuffering(true)
  const handleBufferEnd = () => setIsBuffering(false)

  const handleReplay = () => {
    setPlaying(true)
    playerRef.current?.seekTo(0)
  }

  const handleDownloadCertificate = () => {
    setShowCertificateOverlay(true)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${session?.user?.name}'s Certificate for ${courseName}`,
          text: `Check out my certificate for completing ${courseName} on CourseAI!`,
          url: `https://courseai.com/certificate/${encodeURIComponent(courseName)}`,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        alert("Sharing is not supported on this browser. You can copy the certificate link manually.")
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
    }
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-xl group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleVideoEnd}
          onReady={handleReady}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          progressInterval={1000}
          playbackRate={playbackSpeed}
          config={{
            youtube: {
              playerVars: {
                start: Math.floor(initialTime),
                modestbranding: 1,
                rel: playerConfig.showRelatedVideos ? 1 : 0,
              },
            },
          }}
        />

        <div className="absolute top-4 right-4 z-10">{brandLogo}</div>

        {showCertificateOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Congratulations! You've completed the course.</h2>
              <div className="space-y-4">
                <PDFDownloadLink
                  document={<Certificate userName={session?.user?.name || "Student"} courseName={courseName} />}
                  fileName={`${courseName.replace(/\s+/g, "_")}_Certificate.pdf`}
                >
                  {({ blob, url, loading, error }) => (
                    <Button disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">
                      <Download className="mr-2 h-4 w-4" />
                      {loading ? "Generating certificate..." : "Download Certificate"}
                    </Button>
                  )}
                </PDFDownloadLink>
                <Button onClick={handleShare} className="bg-green-500 hover:bg-green-600">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Certificate
                </Button>
                <Button onClick={() => setShowCertificateOverlay(false)} className="bg-gray-500 hover:bg-gray-600">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {showCourseAIVideos && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
            <div className="text-white text-center max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Related Videos</h3>
              {courseAIVideos.length > 0 ? (
                <ul className="space-y-2">
                  {courseAIVideos.map((video) => (
                    <li
                      key={video.id}
                      className="text-lg hover:text-cyan-400 cursor-pointer p-2 rounded transition-colors"
                      onClick={() => {
                        setShowCourseAIVideos(false)
                        onVideoSelect(video.id)
                      }}
                    >
                      {video.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No related videos available.</p>
              )}
              <Button onClick={() => setShowCourseAIVideos(false)} className="mt-4 bg-cyan-500 hover:bg-cyan-600">
                Close
              </Button>
            </div>
          </div>
        )}

        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <Slider
            value={[played]}
            onValueChange={handleSeekChange}
            max={1}
            step={0.001}
            className="w-full mb-2 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-cyan-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pause</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSkip(-10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rewind 10 seconds</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSkip(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward 10 seconds</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleReplay} className="text-white hover:bg-white/20">
                    <Repeat className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Replay</p>
                </TooltipContent>
              </Tooltip>

              <span className="text-white text-sm ml-2">
                {formatTime(duration * played)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleMute} className="text-white hover:bg-white/20">
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{muted ? "Unmute" : "Mute"}</p>
                  </TooltipContent>
                </Tooltip>
                <Slider
                  value={[muted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-20 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-cyan-400"
                />
              </div>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Quality: {quality}</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {getVideoQualityOptions(availableQualities).map((option) => (
                          <DropdownMenuItem key={option.value} onSelect={() => handleQualityChange(option.value)}>
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Speed: {playbackSpeed}x</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem key={speed.value} onSelect={() => handlePlaybackSpeedChange(speed.value)}>
                            {speed.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {playerConfig.showRelatedVideos && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCourseAIVideos(true)}
                      className="text-white hover:bg-white/20"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show Related Videos</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {isLastVideo && playerConfig.showCertificateButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownloadCertificate}
                      className="text-white hover:bg-white/20"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download Certificate</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default EnhancedVideoPlayer

