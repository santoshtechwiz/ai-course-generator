"use client";
import { formatTime } from "@/lib/utils";
import {
  FastForward,
  PauseIcon,
  PlayIcon,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import HD from "../../public/hd.svg";
import Image from "next/image";

type PlayerControlsProps = {
  onPlay: () => void;
  onPause: () => void;
  onMute: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onQualityChange: () => void;
  ForwardBy10: () => void;
  rewindBy10: () => void;
  updateTimerDisplay: () => TimeState;
  //progressPlayer: (number:any) => number;
  currentTime: any;
};

interface TimeState {
  start: string;
  total: string;
}
const PlayerControls: React.FC<PlayerControlsProps> = ({
  onPlay,
  onPause,
  onMute,
  onChangePlaybackRate,
  onQualityChange,
  updateTimerDisplay,
  ForwardBy10,
  rewindBy10,
  // progressPlayer,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackRateOptions, setShowPlaybackRateOptions] = useState(false);
  const [currentTime, setcurrentTime] = useState<TimeState>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPlaybackRateOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePlay = () => {
    onPlay();
    setIsPlaying(true);
  };

  const handlePause = () => {
    onPause();
    setIsPlaying(false);
  };

  const handleMute = () => {
    onMute();
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    onChangePlaybackRate(rate);
    setShowPlaybackRateOptions(false);
  };

  const togglePlaybackRateOptions = () => {
    setShowPlaybackRateOptions((prevState) => !prevState);
  };

  const handleQualityChange = async () => {
    const data = await onQualityChange();
  };

  const duration = async () => {
    var currentTime = await updateTimerDisplay();
    setcurrentTime(currentTime);
  };
  const onFastFarward = () => {
    ForwardBy10();
  };

  const onFastBackward = () => {
    rewindBy10();
  };

  const updateProgress = () => {
    var newValue = progressPlayer(0);
    return newValue;
  };

  useEffect(() => {
    duration();
  });

  return (
    <div className="flex space-x-4 items-center">
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? handlePause : handlePlay}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
      >
        {isPlaying ? (
          <PauseIcon className="w-6 h-6 text-red-500" />
        ) : (
          <PlayIcon className="w-6 h-6 text-green-500" />
        )}
      </button>

      {/* Mute/Unmute Button */}
      <button
        onClick={handleMute}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
      >
        {!isMuted ? (
          <Volume2 className="w-6 h-6 text-gray-500" />
        ) : (
          <VolumeX className="w-6 h-6 text-blue-500" />
        )}
      </button>

      {/* Forward Button */}
      <button
        onClick={handleQualityChange}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
      >
        <Image
          src={HD}
          className="w-6 h-6"
          height={6}
          width={6}
          alt="Icon"
        ></Image>
      </button>
      <button
        onClick={onFastBackward}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
      >
        <FastForward />
      </button>

      <button
        onClick={onFastFarward}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
      >
        <FastForward />
      </button>

      {/* Playback Rate Button */}
      <div className="relative">
        <button
          className="flex items-center"
          onClick={togglePlaybackRateOptions}
        >
          <Settings className="w-5 h-5 mr-1 text-blue-500" />
          {playbackRate}x
        </button>
        {showPlaybackRateOptions && (
          <div
            ref={dropdownRef}
            className="absolute left-0 mt-2 py-1 bg-white shadow-lg rounded-lg border border-gray-200 z-10"
          >
            <button
              onClick={() => handlePlaybackRateChange(0.5)}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              0.5x
            </button>
            <button
              onClick={() => handlePlaybackRateChange(1)}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              1x
            </button>
            <button
              onClick={() => handlePlaybackRateChange(1.5)}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              1.5x
            </button>
            <button
              onClick={() => handlePlaybackRateChange(2)}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              2x
            </button>
          </div>
        )}
      </div>

      {/* Time Display */}
      {currentTime && (
        <div className="inline-block bg-gray-200 rounded-md p-2">
          <span className="font-medium text-green-700" id="current-time">
            {formatTime(currentTime?.start)}
          </span>

          <span className="font-medium text-pink-700" id="total-time">
            /{formatTime(currentTime?.total)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
