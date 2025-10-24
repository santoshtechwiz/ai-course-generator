"use client";

import { NeoLoader } from "@/components/loader";
import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function Loading({
  text = "Loading...",
  className,
  size = "md"
}: LoadingProps) {
  return (
    <NeoLoader
      message={text}
      size={size}
      variant="spinner"
      inline
      className={className}
    />
  );
}


