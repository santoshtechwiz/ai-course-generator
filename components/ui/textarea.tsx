import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border-4 border-black bg-[var(--color-bg)] selection:bg-[var(--color-primary)] selection:text-white px-3 py-2 text-sm font-base text-[var(--color-text)] placeholder:text-[var(--color-text)]/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 shadow-[4px_4px_0_#000]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
