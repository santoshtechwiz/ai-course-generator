"use client";

import { useEffect } from "react";
import { useLoaderContext } from "../providers/laderContext";
import { usePathname } from "next/navigation";

export function NavigationEvents() {
  const pathname = usePathname(); // ✅ Ensure slug changes trigger effects
  const { startNavigation, completeNavigation } = useLoaderContext();

  useEffect(() => {
    const handleStart = () => startNavigation();
    const handleComplete = () => completeNavigation();

    window.addEventListener("beforeunload", handleStart);
    window.addEventListener("load", handleComplete);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
      window.removeEventListener("load", handleComplete);
    };
  }, [startNavigation, completeNavigation]); // ✅ Removed unused dependencies

  useEffect(() => {
    startNavigation();
    const timer = setTimeout(() => completeNavigation(), 300);
    return () => clearTimeout(timer);
  }, [startNavigation, completeNavigation,pathname]); // ✅ Removed unused dependencies

  return null;
}
