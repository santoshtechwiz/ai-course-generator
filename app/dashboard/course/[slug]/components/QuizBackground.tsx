"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"

const QuizBackground: React.FC = () => {
  const { theme } = useTheme()

  const isDark = theme === "dark"

  // Generate a random pattern each time the component mounts
  // This is memoized to prevent re-renders
  const patternStyle = useMemo(() => {
    return {
      backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px)`,
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0",
    }
  }, [])

  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-70"
      style={patternStyle}
      aria-hidden="true"
    />
  )
}

export default QuizBackground
