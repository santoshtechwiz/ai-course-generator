import React from "react";
import { Rings } from "react-loader-spinner";

const PageLoader = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-background gap-4">
      {/* Futuristic AI-themed loader */}
      <Rings
        visible={true}
        height="120"
        width="120"
        radius="6"
        color="#3b82f6" // Blue color for a tech/AI vibe
        ariaLabel="rings-loading"
      />
      {/* Optional: Add a loading text with a modern font */}
      <p className="text-lg font-medium text-foreground/80">
        Generating AI magic...
      </p>
    </div>
  );
};

export default PageLoader;