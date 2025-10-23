import React from "react";

interface FormContainerProps {
  children: React.ReactNode;
  spacing?: "sm" | "md" | "lg";
  variant?: "glass" | "default";
  className?: string;
}

const spacingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

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
          ? "bg-neo-background border-4 border-neo-border rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)]"
          : "bg-neo-background rounded-xl shadow-[4px_4px_0px_0px_var(--neo-border)]"
      } ${className} flex flex-col gap-6 sm:gap-8`}
    >
      {children}
    </div>
  );
}
