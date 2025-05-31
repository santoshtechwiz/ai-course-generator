import { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Quiz Results",
  description: "View your quiz results and performance",
}

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
}

export default function OpenEndedResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-10">
      {children}
    </div>
  )
}
