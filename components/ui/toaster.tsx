"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
        },
        className: "font-sans",
        descriptionClassName: "text-sm text-muted-foreground mt-1",
      }}
      closeButton
      richColors
      expand
      visibleToasts={5}
    />
  )
}
