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
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
          : "bg-background rounded-xl shadow-md"
      } ${className} flex flex-col gap-6 sm:gap-8`}
    >
      {children}
    </div>
  );
}
