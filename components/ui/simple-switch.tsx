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
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-4 border-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-[2px_2px_0_#000]",
          checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-bg)]",
          isPressed && "shadow-[1px_1px_0_#000] translate-x-[1px] translate-y-[1px]",
          className
        )}
        {...props}
      >
        <span 
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-[var(--color-text)] border-2 border-black shadow-[2px_2px_0_#000] transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);

SimpleSwitch.displayName = "SimpleSwitch";