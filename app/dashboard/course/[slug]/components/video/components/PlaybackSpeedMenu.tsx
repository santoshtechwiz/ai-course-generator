import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/tailwindUtils";
import type { PlaybackSpeedMenuProps } from "../types";

// Default playback speed options
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PlaybackSpeedMenu: React.FC<PlaybackSpeedMenuProps> = ({
  currentSpeed,
  onSpeedChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Format the speed value for display
  const formatSpeed = (speed: number): string => {
    return speed === 1 ? "Normal" : `${speed}×`;
  };

  return (
    <div ref={menuRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-muted/80"
            aria-label="Change playback speed"
          >
            <span>{formatSpeed(currentSpeed)}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-32 p-1"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {SPEED_OPTIONS.map((speed) => (
            <DropdownMenuItem
              key={speed}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                currentSpeed === speed && "bg-accent"
              )}
              onClick={() => {
                onSpeedChange(speed);
                setIsOpen(false);
              }}
            >
              <span>{formatSpeed(speed)}</span>
              {currentSpeed === speed && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default React.memo(PlaybackSpeedMenu);
