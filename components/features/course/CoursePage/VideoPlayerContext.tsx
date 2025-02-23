import React, { createContext, useState, ReactNode } from 'react';

interface VideoPlayerContextType {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  duration: number;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  quality: string;
  setQuality: React.Dispatch<React.SetStateAction<string>>;
  currentQuality: string;
  setCurrentQuality: React.Dispatch<React.SetStateAction<string>>;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  availableQualities: string[];
  setAvailableQualities: React.Dispatch<React.SetStateAction<string[]>>;
}

export const VideoPlayerContext = createContext<VideoPlayerContextType>({
  isPlaying: false,
  setIsPlaying: () => {},
  isMuted: false,
  setIsMuted: () => {},
  duration: 0,
  setDuration: () => {},
  quality: 'auto',
  setQuality: () => {},
  currentQuality: 'auto',
  setCurrentQuality: () => {},
  progress: 0,
  setProgress: () => {},
  availableQualities: [],
  setAvailableQualities: () => {},
});

export const VideoPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [progress, setProgress] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  const value = {
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    duration,
    setDuration,
    quality,
    setQuality,
    currentQuality,
    setCurrentQuality,
    progress,
    setProgress,
    availableQualities,
    setAvailableQualities,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export default VideoPlayerProvider;

