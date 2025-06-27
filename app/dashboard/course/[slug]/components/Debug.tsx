"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bug, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DebugInfo {
  videoId: string
  playing: boolean
  duration: number
  played: number
  loaded: number
  playerState: string
  lastEvent: string
  errors: string[]
}

interface DebugProps {
  info: DebugInfo,
  onReset?: () => void
}

export const Debug = ({ info, onReset }: DebugProps) => {
  const [show, setShow] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    playerState: true,
    events: false,
    errors: true // Auto-expand errors section when there are errors
  });

  // Only show in development mode
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const hasErrors = Array.isArray(info.errors) && info.errors.length > 0;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      <Button
        variant={hasErrors ? "destructive" : "outline"}
        size="sm"
        className={`absolute top-2 right-2 z-50 ${hasErrors ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
        onClick={() => setShow(!show)}
      >
        <Bug className="h-4 w-4" />
        {hasErrors && <span className="ml-1 text-xs">{info.errors.length}</span>}
      </Button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 right-2 z-50 bg-black/80 text-white p-4 rounded-lg text-xs font-mono w-64"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Player Debug</h3>
              <div className="flex gap-1">
                {onReset && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 text-white hover:text-primary"
                    onClick={onReset}
                    title="Reset player state"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:text-primary"
                  onClick={() => setShow(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Fix: Ensure we're handling all object properties safely */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold text-primary">Player State</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0 text-white hover:text-primary" 
                  onClick={() => toggleSection("playerState")}
                >
                  {expandedSections.playerState ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              
              {expandedSections.playerState && (
                <div className="pl-2 space-y-1 text-xs">
                  <div>Video ID: <span className="text-green-400">{info?.videoId || 'none'}</span></div>
                  <div>Playing: <span className={info?.playing ? "text-green-400" : "text-red-400"}>{String(info?.playing || false)}</span></div>
                  <div>Duration: <span className="text-blue-400">{(info?.duration || 0).toFixed(2)}s</span></div>
                  <div>Progress: <span className="text-blue-400">{info?.played || 0}%</span></div>
                  <div>Loaded: <span className="text-blue-400">{info?.loaded || 0}%</span></div>
                </div>
              )}
              
              <div className="flex items-center justify-between border-t border-white/20 pt-2">
                <h4 className="text-xs uppercase font-bold text-primary">Events</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0 text-white hover:text-primary" 
                  onClick={() => toggleSection("events")}
                >
                  {expandedSections.events ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
              
              {expandedSections.events && (
                <div className="pl-2 space-y-1 text-xs">
                  <div>State: <span className="text-yellow-400">{info?.playerState || 'unknown'}</span></div>
                  <div>Last Event: <span className="text-yellow-400">{info?.lastEvent || 'none'}</span></div>
                </div>
              )}
              
              {hasErrors && (
                <>
                  <div className="flex items-center justify-between border-t border-white/20 pt-2">
                    <h4 className="text-xs uppercase font-bold text-red-400">Errors ({info.errors.length})</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 w-5 p-0 text-white hover:text-primary" 
                      onClick={() => toggleSection("errors")}
                    >
                      {expandedSections.errors ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  {expandedSections.errors && (
                    <div className="pl-2 space-y-1 text-xs max-h-32 overflow-y-auto pr-1">
                      {info.errors.map((error, i) => (
                        <div key={i} className="text-red-400 break-words">{i+1}. {error}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Debug;
