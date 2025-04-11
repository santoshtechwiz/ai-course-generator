"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import { useTheme } from "next-themes";

// Remove default styles
import "nprogress/nprogress.css";

// Improved custom styles with smoother transitions and modern aesthetics
const improvedStyles = `
  #nprogress {
    pointer-events: none;
  }
  
  #nprogress .bar {
    background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)));
    position: fixed;
    z-index: 1100;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    transition: width 400ms ease-out;
  }
  
  #nprogress .peg {
    display: none;
  }

  /* Page transition overlay with backdrop blur */
  .page-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    opacity: 0;
    pointer-events: none;
    z-index: 1090;
    transition: opacity 300ms ease-in-out;
  }

  .nprogress-loading .page-transition-overlay {
    opacity: 1;
    pointer-events: all;
  }

  /* Loading spinner */
  .loading-spinner {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1110;
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }

  .nprogress-loading .loading-spinner {
    opacity: 1;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top-color: hsl(var(--primary));
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

NProgress.configure({
  minimum: 0.1,
  easing: "ease-out",
  speed: 500,
  showSpinner: false,
  trickleSpeed: 300,
});

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    const handleStart = () => {
      document.documentElement.classList.add("nprogress-loading");
      NProgress.start();
    };

    const handleStop = () => {
      NProgress.done();
      document.documentElement.classList.remove("nprogress-loading");
    };

    handleStart();
    const timeout = setTimeout(handleStop, 500); // Fallback in case navigation stalls

    return () => {
      clearTimeout(timeout);
      handleStop();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    // Apply improved custom styles
    const styleElement = document.createElement("style");
    styleElement.textContent = improvedStyles;
    document.head.appendChild(styleElement);

    // Create overlay element
    const overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    document.body.appendChild(overlay);

    // Create spinner element
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(spinner);

    return () => {
      document.head.removeChild(styleElement);
      document.body.removeChild(overlay);
      document.body.removeChild(spinner);
    };
  }, []);

  return null;
}
