"use client";

/**
 * @deprecated Use InlineLoader from @/components/loaders instead
 * This file is kept for backward compatibility only
 */

import { InlineLoader } from "@/components/loaders";

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
    <InlineLoader
      message={text}
      size={size}
      variant="spinner"
      className={className}
    />
  );
}

export default Loading;


