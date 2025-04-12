"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"
import { useTheme } from "next-themes"

// Remove default styles
import "nprogress/nprogress.css"

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
    height: 3px;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 10px rgba(var(--primary), 0.2);
    transition: width 300ms ease-out;
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
    background-color: hsl(var(--background) / 0.7);
    backdrop-filter: blur(4px);
    opacity: 0;
    pointer-events: none;
    z-index: 1090;
    transition: opacity 200ms ease-in-out;
  }

  .nprogress-loading .page-transition-overlay {
    opacity: 1;
    pointer-events: all;
  }

  /* Loading spinner container */
  .loading-spinner-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1110;
    opacity: 0;
    transition: opacity 200ms ease-in-out;
  }

  .nprogress-loading .loading-spinner-container {
    opacity: 1;
  }
`

NProgress.configure({
  minimum: 0.1,
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
      document.documentElement.classList.add("nprogress-loading")
      NProgress.start()
    }

    const handleStop = () => {
      NProgress.done()
      document.documentElement.classList.remove("nprogress-loading")
    }

    handleStart()
    const timeout = setTimeout(handleStop, 500) // Fallback in case navigation stalls

    return () => {
      clearTimeout(timeout)
      handleStop()
    }
  }, [pathname, searchParams])

  useEffect(() => {
    // Apply improved custom styles
    const styleElement = document.createElement("style")
    styleElement.textContent = improvedStyles
    document.head.appendChild(styleElement)

    // Create overlay element
    const overlay = document.createElement("div")
    overlay.className = "page-transition-overlay"
    document.body.appendChild(overlay)

    // Create spinner container
    const spinnerContainer = document.createElement("div")
    spinnerContainer.className = "loading-spinner-container"
    document.body.appendChild(spinnerContainer)

    // Render the loader component into the spinner container
    const renderLoader = () => {
      const loaderElement = document.createElement("div")
      loaderElement.className = "flex flex-col items-center gap-3"

      // Create spinner
      const spinner = document.createElement("div")
      spinner.className = "relative h-12 w-12"

      const spinnerBg = document.createElement("div")
      spinnerBg.className = "absolute inset-0 rounded-full border-2 border-primary/30"

      const spinnerFg1 = document.createElement("div")
      spinnerFg1.className = "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"

      const spinnerFg2 = document.createElement("div")
      spinnerFg2.className =
        "absolute inset-0 rounded-full border-2 border-transparent border-l-primary/70 animate-spin-slow"

      spinner.appendChild(spinnerBg)
      spinner.appendChild(spinnerFg1)
      spinner.appendChild(spinnerFg2)

      // Create text
      const text = document.createElement("p")
      text.className = "text-sm text-muted-foreground animate-fade-in"
      text.textContent = "Loading..."

      loaderElement.appendChild(spinner)
      loaderElement.appendChild(text)

      return loaderElement
    }

    spinnerContainer.appendChild(renderLoader())

    return () => {
      document.head.removeChild(styleElement)
      document.body.removeChild(overlay)
      document.body.removeChild(spinnerContainer)
    }
  }, [])

  return null
}
