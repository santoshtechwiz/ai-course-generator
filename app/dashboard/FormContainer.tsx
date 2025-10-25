import type React from "react"

interface FormContainerProps {
  children: React.ReactNode
  spacing?: "sm" | "md" | "lg"
  variant?: "glass" | "default"
  className?: string
}

const spacingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export default function FormContainer({
  children,
  spacing = "md",
  variant = "default",
  className = "",
}: FormContainerProps) {
  return (
    <div
      className={`w-full max-w-2xl mx-auto ${spacingMap[spacing]} ${
        variant === "glass"
          ? /* Use theme tokens instead of undefined neo-* variables */
            "bg-card border-4 border-border rounded-xl shadow-[4px_4px_0px_0px_var(--border)]"
          : "bg-card rounded-xl shadow-[4px_4px_0px_0px_var(--border)]"
      } ${className} flex flex-col gap-6 sm:gap-8`}
    >
      {children}
    </div>
  )
}
