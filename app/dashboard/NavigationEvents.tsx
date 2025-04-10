"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import { useTheme } from "next-themes"

// Remove default styles
import "nprogress/nprogress.css"

// Custom styles with better animations
const npProgressStyles = `
  #nprogress {
    pointer-events: none;
  }
  
  #nprogress .bar {
    background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)));
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    border-radius: 0 2px 2px 0;
    transition: width 300ms ease-out;
  }
  
  #nprogress .peg {
    display: none;
  }

  /* Pulse animation for the progress bar */
  @keyframes progress-pulse {
    0% { opacity: 0.6; width: 0%; }
    50% { opacity: 1; width: 70%; }
    100% { opacity: 0.6; width: 100%; }
  }

  .nprogress-loading #nprogress .bar {
    animation: progress-pulse 1.5s ease-in-out infinite;
  }

  /* Page transition overlay */
  .page-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: hsl(var(--background));
    opacity: 0;
    pointer-events: none;
    z-index: 9998;
    transition: opacity 300ms ease-out;
  }

  .nprogress-loading .page-transition-overlay {
    opacity: 0.7;
    pointer-events: all;
  }

  /* Loading spinner */
  .loading-spinner {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    display: none;
  }

  .nprogress-loading .loading-spinner {
    display: block;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 5px solid hsl(var(--muted));
    border-bottom-color: hsl(var(--primary));
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

NProgress.configure({
  minimum: 0.2,
  easing: "ease-out",
  speed: 400,
  showSpinner: false,
  trickleSpeed: 200,
})

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { theme } = useTheme()

  useEffect(() => {
    const handleStart = () => {
      document.documentElement.classList.add('nprogress-loading')
      NProgress.start()
    }
    
    const handleStop = () => {
      document.documentElement.classList.remove('nprogress-loading')
      NProgress.done()
    }

    handleStart()
    const timeout = setTimeout(handleStop, 500) // Fallback in case navigation stalls

    return () => {
      clearTimeout(timeout)
      handleStop()
    }
  }, [pathname, searchParams])

  useEffect(() => {
    // Apply custom styles
    const styleElement = document.createElement("style")
    styleElement.textContent = npProgressStyles
    document.head.appendChild(styleElement)

    // Add overlay and spinner elements
    const overlay = document.createElement("div")
    overlay.className = "page-transition-overlay"
    document.body.appendChild(overlay)

    const spinner = document.createElement("div")
    spinner.className = "loading-spinner"
    spinner.innerHTML = '<div class="spinner"></div>'
    document.body.appendChild(spinner)

    return () => {
      document.head.removeChild(styleElement)
      document.body.removeChild(overlay)
      document.body.removeChild(spinner)
    }
  }, [])

  return null
}