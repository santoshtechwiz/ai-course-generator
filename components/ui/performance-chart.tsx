"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

import { motion } from "framer-motion"
import { useResponsive } from "@/hooks"

interface ChartData {
  name: string
  value: number
}

interface PerformanceChartProps {
  data: ChartData[]
  className?: string
}

export function PerformanceChart({ data, className }: PerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const windowSize = useResponsive()

  // Colors based on theme
  const getColors = () => {
    return {
      background: theme === "dark" ? "#1f2937" : "#f9fafb",
      text: theme === "dark" ? "#e5e7eb" : "#374151",
      muted: theme === "dark" ? "#9ca3af" : "#6b7280",
      grid: theme === "dark" ? "#374151" : "#e5e7eb",
      bars: [
        theme === "dark" ? "rgba(59, 130, 246, 0.7)" : "rgba(59, 130, 246, 0.7)",
        theme === "dark" ? "rgba(16, 185, 129, 0.7)" : "rgba(16, 185, 129, 0.7)",
        theme === "dark" ? "rgba(139, 92, 246, 0.7)" : "rgba(139, 92, 246, 0.7)",
        theme === "dark" ? "rgba(249, 115, 22, 0.7)" : "rgba(249, 115, 22, 0.7)",
      ],
      barsBorder: [
        theme === "dark" ? "#3b82f6" : "#3b82f6",
        theme === "dark" ? "#10b981" : "#10b981",
        theme === "dark" ? "#8b5cf6" : "#8b5cf6",
        theme === "dark" ? "#f97316" : "#f97316",
      ],
    }
  }

  useEffect(() => {
    if (!chartRef.current || !data?.length) return

    const colors = getColors()
    const chart = chartRef.current
    chart.innerHTML = ""

    // Chart dimensions
    const width = chart.clientWidth
    const height = chart.clientHeight
    const padding = { top: 30, right: 20, bottom: 40, left: 60 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", width.toString())
    svg.setAttribute("height", height.toString())
    chart.appendChild(svg)

    // Create chart group
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
    g.setAttribute("transform", `translate(${padding.left}, ${padding.top})`)
    svg.appendChild(g)

    // Y axis scale
    const yScale = (value: number) => {
      return innerHeight - (value / 100) * innerHeight
    }

    // X axis scale
    const xScale = (index: number) => {
      return (index * innerWidth) / (data.length - 1)
    }

    // Draw grid lines
    for (let i = 0; i <= 10; i++) {
      const y = yScale(i * 10)
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
      gridLine.setAttribute("x1", "0")
      gridLine.setAttribute("y1", y.toString())
      gridLine.setAttribute("x2", innerWidth.toString())
      gridLine.setAttribute("y2", y.toString())
      gridLine.setAttribute("stroke", colors.grid)
      gridLine.setAttribute("stroke-width", "1")
      gridLine.setAttribute("stroke-dasharray", "3,3")
      g.appendChild(gridLine)

      // Y axis labels
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.setAttribute("x", "-5")
      label.setAttribute("y", y.toString())
      label.setAttribute("text-anchor", "end")
      label.setAttribute("dominant-baseline", "middle")
      label.setAttribute("fill", colors.muted)
      label.setAttribute("font-size", "10")
      label.textContent = `${i * 10}%`
      g.appendChild(label)
    }

    // Draw bars
    data.forEach((item, i) => {
      const barWidth = (innerWidth / data.length) * 0.6
      const x = (i * innerWidth) / data.length + (innerWidth / data.length) * 0.2
      const barHeight = (item.value / 100) * innerHeight
      const y = innerHeight - barHeight

      // Bar
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      bar.setAttribute("x", x.toString())
      bar.setAttribute("y", y.toString())
      bar.setAttribute("width", barWidth.toString())
      bar.setAttribute("height", "0") // Start with 0 height for animation
      bar.setAttribute("fill", colors.bars[i % colors.bars.length])
      bar.setAttribute("stroke", colors.barsBorder[i % colors.barsBorder.length])
      bar.setAttribute("stroke-width", "1")
      bar.setAttribute("rx", "4")
      g.appendChild(bar)

      // Animate the bar
      setTimeout(() => {
        bar.setAttribute("height", barHeight.toString())
        bar.style.transition = "height 1s ease-out"
      }, 100 * i)

      // X axis labels
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.setAttribute("x", (x + barWidth / 2).toString())
      label.setAttribute("y", (innerHeight + 20).toString())
      label.setAttribute("text-anchor", "middle")
      label.setAttribute("fill", colors.text)
      label.setAttribute("font-size", "12")
      label.textContent = item.name
      g.appendChild(label)

      // Value labels
      const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
      valueLabel.setAttribute("x", (x + barWidth / 2).toString())
      valueLabel.setAttribute("y", (y - 10).toString())
      valueLabel.setAttribute("text-anchor", "middle")
      valueLabel.setAttribute("fill", colors.text)
      valueLabel.setAttribute("font-size", "12")
      valueLabel.setAttribute("font-weight", "bold")
      valueLabel.textContent = `${Math.round(item.value)}%`
      g.appendChild(valueLabel)
    })
  }, [data, theme, windowSize])

  return (
    <motion.div
      ref={chartRef}
      className={`w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  )
}
