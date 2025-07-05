import CourseAILandingPage from "@/components/landing/CourseAILandingPage"
import { generateMetadata, JsonLD } from '@/lib/seo-manager-new'

export const metadata = generateMetadata({
  title: 'Home',
  description: 'Welcome to AI Learning - your platform for mastering artificial intelligence',
})

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <JsonLD
        type="website"
        data={{
          name: 'AI Learning Platform',
          url: 'https://ai-learning-platform.com',
        }}
      />
      <div className="flex-grow">
        <CourseAILandingPage />
      </div>
    </div>
  )
}
