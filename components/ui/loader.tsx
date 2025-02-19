'use client';

import React from "react";
import { ThreeCircles } from "react-loader-spinner";
import { cn } from "@/lib/utils";

const PageLoader = () => {
  return (
    <div className={cn(
      "flex justify-center items-center h-screen w-full bg-background",
      "animate-fadeIn"
    )}>
      <ThreeCircles
        visible={true}
        height={64} // Reduced size for better UX
        width={64}
        color="hsl(var(--primary))" // Aligning with ShadCN primary color
        ariaLabel="loading"
      />
    </div>
  );
};

export default PageLoader;
