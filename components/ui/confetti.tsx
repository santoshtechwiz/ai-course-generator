"use client"

import { useEffect, useRef } from "react"

interface ConfettiProps {
  isActive: boolean
  count?: number
  duration?: number
}

export function Confetti({ isActive, count = 150, duration = 3000 }: ConfettiProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  useEffect(() => {
    if (!isActive) return
    
    let confettiContainer: HTMLElement | null = null
    
    const createConfetti = () => {
      confettiContainer = document.createElement("div")
      
      // Set container styles
      Object.assign(confettiContainer.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "9999",
        perspective: "1000px",
      })
      
      document.body.appendChild(confettiContainer)

      // Use DocumentFragment for better performance
      const fragment = document.createDocumentFragment()
      
      for (let i = 0; i < count; i++) {
        const confetti = document.createElement("div")
        const size = Math.random() * 10 + 5
        
        // Set all styles at once for better performance
        Object.assign(confetti.style, {
          position: "absolute",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
          borderRadius: Math.random() > 0.5 ? "50%" : "0",
          top: "0",
          left: `${Math.random() * 100}%`,
          willChange: "transform, opacity",
          transform: "translateZ(0)", // Hardware acceleration hint
        })

        // Use modern Web Animation API for better performance
        const keyframes = [
          { transform: "translateY(0) rotate(0)", opacity: 1 },
          { 
            transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720 - 360}deg)`, 
            opacity: 0 
          }
        ]
        
        const timing = {
          duration: Math.random() * duration + duration/2,
          easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
          fill: "forwards" as FillMode
        }

        const animation = confetti.animate(keyframes, timing)
        
        animation.onfinish = () => {
          confetti.remove()
          if (confettiContainer && confettiContainer.childElementCount === 0) {
            confettiContainer.remove()
          }
        }
        
        fragment.appendChild(confetti)
      }
      
      // Add all confetti pieces at once to minimize reflows
      if (confettiContainer) {
        confettiContainer.appendChild(fragment)
      }
    }

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(createConfetti)

    return () => {
      if (confettiContainer) {
        confettiContainer.remove()
      }
    }
  }, [isActive, count, duration])

  return <div ref={containerRef} className="confetti-container" />
}
