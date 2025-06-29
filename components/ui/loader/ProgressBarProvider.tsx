// components/ProgressBarProvider.tsx
"use client"; // This directive marks this as a Client Component

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import React from "react"; // Import React for React.ReactNode type

interface ProgressBarProviderProps {
  children: React.ReactNode;
}

export default function ProgressBarProvider({
  children,
}: ProgressBarProviderProps) {
  return (
    <>
      {children}
      <ProgressBar
        height="4px" // Height of the progress bar
        color="#0A2FFF" // Color of the progress bar (a vibrant blue)
        options={{ showSpinner: false }} // Hide the default NProgress spinner for a cleaner look
        shallowRouting // Essential for correct behavior with Next.js shallow routing
      />
    </>
  );
}
