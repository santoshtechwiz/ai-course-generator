import React from "react";
import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PlaybackSpeedMenuProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PlaybackSpeedMenu: React.FC<PlaybackSpeedMenuProps> = ({
  currentSpeed,
  onSpeedChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs px-2">
          <span className="font-mono">{currentSpeed}x</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {PLAYBACK_SPEEDS.map((speed) => (
          <DropdownMenuItem
            key={speed}
            className="flex items-center justify-between"
            onClick={() => onSpeedChange(speed)}
          >
            <span>{speed}x</span>
            {speed === currentSpeed && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(PlaybackSpeedMenu);
