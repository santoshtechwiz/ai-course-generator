import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[var(--radius)] border-4 border-[var(--color-border)] bg-[var(--color-bg)] selection:bg-[var(--color-primary)] selection:text-white px-3 py-2 text-sm font-base text-[var(--color-text)] file:border-0 file:bg-transparent file:text-sm file:font-heading placeholder:text-[var(--color-text)]/50 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 shadow-[var(--shadow-neo)]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
