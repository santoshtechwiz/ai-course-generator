"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAsyncWithLoader } from '@/components/ui/loader/use-async-with-loader';
import { useLoader } from '@/components/ui/loader/loader-context';

export default function LoaderTest() {
  const { showLoader, hideLoader, updateLoader } = useLoader();
  const { withLoader } = useAsyncWithLoader();

  const handleShowLoader = () => {
    showLoader({
      message: "Testing the loader...",
      variant: "clip",
      fullscreen: true
    });

    // Hide after 3 seconds
    setTimeout(hideLoader, 3000);
  };

  const handleShowProgressLoader = () => {
    showLoader({
      message: "Loading with progress...",
      variant: "bar",
      showProgress: true,
      progress: 0
    });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      updateLoader({ progress });
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(hideLoader, 500);
      }
    }, 500);
  };

  const handleAsyncOperation = withLoader(async () => {
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    return "Operation complete";
  }, {
    message: "Running async operation...",
    variant: "pulse"
  });

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Loader Testing</h1>
      
      <div className="flex flex-col space-y-4">
        <Button onClick={handleShowLoader}>
          Show Basic Loader
        </Button>
        
        <Button onClick={handleShowProgressLoader}>
          Show Progress Loader
        </Button>
        
        <Button onClick={handleAsyncOperation}>
          Test Async Operation
        </Button>
      </div>
    </div>
  );
}
