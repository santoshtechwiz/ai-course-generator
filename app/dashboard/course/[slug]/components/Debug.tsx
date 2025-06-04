"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bug, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DebugProps {
  info: {
    videoId: string
    playing: boolean
    duration: number
    played: number
    loaded: number
    playerState: string
    lastEvent: string
    errors: string[]
  }
}

export const Debug = ({ info }: DebugProps) => {
  const [show, setShow] = useState(false);

  if (!process.env.NODE_ENV || process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 z-50 opacity-50 hover:opacity-100"
        onClick={() => setShow(!show)}
      >
        <Bug className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 right-2 z-50 bg-black/80 text-white p-4 rounded-lg text-xs font-mono w-64"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setShow(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="space-y-2">
              <div>Video ID: {info.videoId}</div>
              <div>Playing: {String(info.playing)}</div>
              <div>Duration: {info.duration.toFixed(2)}s</div>
              <div>Progress: {info.played}%</div>
              <div>Loaded: {info.loaded}%</div>
              <div>State: {info.playerState}</div>
              <div>Last Event: {info.lastEvent}</div>
              {info.errors.length > 0 && (
                <div className="text-red-400">
                  Errors:
                  {info.errors.map((error, i) => (
                    <div key={i} className="pl-2">- {error}</div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
