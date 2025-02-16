"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import { useTheme } from "next-themes";

// Remove default styles
import "nprogress/nprogress.css";

// Custom styles
const npProgressStyles = `
  #nprogress {
    
  }
  
  #nprogress .bar {
    background: hsl(var(--primary));
    position: fixed;
    z-index: 1031;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
  }
  
  #nprogress .peg {
    display: block;
    position: absolute;
    right: 0px;
    width: 100px;
    height: 100%;
    box-shadow: 0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary));
    opacity: 1.0;
    transform: rotate(3deg) translate(0px, -4px);
  }

  #nprogress::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(to right, transparent, hsl(var(--primary)), transparent);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }

  .dark #nprogress .bar,
  .dark #nprogress::after {
    box-shadow: 0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary));
  }
`;

NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
});

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    NProgress.done();
    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    // Apply custom styles
    const styleElement = document.createElement("style");
    styleElement.textContent = npProgressStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
}