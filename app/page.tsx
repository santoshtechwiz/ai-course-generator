import LandingComponent from "@/components/landing/LandingComponent"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Course AI: Intelligent Learning Platform",
  description:
    "Discover a smarter way to learn with Course AI. Create and take personalized quizzes, generate courses, and enhance your educational journey.",
}

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-2 md:p-4">
        <LandingComponent />
      </div>
    </div>
  )
}

export default HomePage

