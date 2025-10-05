"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamic import for Recharts to reduce initial bundle
// Recharts is large (~500KB), only load when charts are needed
// Using default export pattern for better compatibility

export const DynamicBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false,
  }
)

export const DynamicLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false,
  }
)

export const DynamicPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false,
  }
)

export const DynamicRadarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.RadarChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false,
  }
)

export const DynamicAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  {
    loading: () => <ChartLoader />,
    ssr: false,
  }
)

// Export other Recharts components with default wrapper
export const DynamicXAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.XAxis })),
  { ssr: false }
)

export const DynamicYAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.YAxis })),
  { ssr: false }
)

export const DynamicCartesianGrid = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.CartesianGrid })),
  { ssr: false }
)

export const DynamicTooltip = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Tooltip })),
  { ssr: false }
)

export const DynamicLegend = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Legend })),
  { ssr: false }
)

export const DynamicBar = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Bar })),
  { ssr: false }
)

export const DynamicLine = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Line })),
  { ssr: false }
)

export const DynamicArea = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Area })),
  { ssr: false }
)

export const DynamicPie = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Pie })),
  { ssr: false }
)

export const DynamicCell = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Cell })),
  { ssr: false }
)

export const DynamicResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
)

function ChartLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] bg-muted/50 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  )
}
