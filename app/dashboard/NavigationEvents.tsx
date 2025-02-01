"use client";

import { useEffect, useRef } from "react";
import { useLoaderContext } from "../providers/loadingContext";
import { usePathname } from "next/navigation";

export function NavigationEvents() {
  const pathname = usePathname();
  const { startNavigation, completeNavigation } = useLoaderContext();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if the pathname has changed
    if (previousPathnameRef.current !== pathname) {
      // Trigger the loader when the pathname changes
      startNavigation();

      // Simulate a delay for the loader to complete
      const timer = setTimeout(() => {
        completeNavigation();
      }, 300); // Adjust the delay as needed

      // Update the previous pathname
      previousPathnameRef.current = pathname;

      // Cleanup the timer
      return () => clearTimeout(timer);
    }
  }, [pathname, startNavigation, completeNavigation]);

  return null;
}