"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleSwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const SimpleSwitch = React.forwardRef<HTMLButtonElement, SimpleSwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    // Local state just for visual feedback - actual state is controlled by parent
    const [isPressed, setIsPressed] = React.useState(false);

    const handleClick = React.useCallback(() => {
      if (disabled) return;
      
      // Don't update any internal state here, just call the handler
      if (onCheckedChange) {
        onCheckedChange(!checked);
      }
    }, [checked, onCheckedChange, disabled]);

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        ref={ref}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-input",
          isPressed && "opacity-90",
          className
        )}
        {...props}
      >
        <span 
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);

SimpleSwitch.displayName = "SimpleSwitch";