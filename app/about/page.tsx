import type { Metadata } from "next"
import { generateMetadata } from "@/lib/seo"
import { ArticleSchema } from "@/lib/seo"
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema"

export const metadata: Metadata = generateMetadata({
  title: "About CourseAI - AI-Powered Educational Technology",
  description: "Learn about CourseAI's mission to revolutionize education with AI-powered course creation, intelligent quiz generation, and personalized learning experiences.",
  keywords: [
    "about courseai",
    "educational technology company",
    "AI education platform",
    "course creation technology",
    "quiz generation AI",
    "educational innovation",
    "learning technology",
    "AI-powered education",
    "educational software company",
    "courseai mission",
    "educational technology startup"
  ],
  canonical: "/about",
  type: "website",
  noIndex: false,
  noFollow: false,
})

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About CourseAI",
  "description": "Learn about CourseAI's mission and vision for AI-powered education",
  "url": "https://courseai.io/about",
  "mainEntity": {
    "@type": "Organization",
    "name": "CourseAI",
    "description": "AI-powered educational technology company",
    "foundingDate": "2024",
    "mission": "To democratize education through AI-powered course creation and intelligent quiz generation"
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbSchema />

      {/* Structured Data */}
      <ArticleSchema
        article={{
          headline: "About CourseAI - Revolutionizing Education with AI",
          description: "Learn about CourseAI's mission and vision for AI-powered education",
          image: "/og-image.jpg",
          datePublished: "2024-01-01",
          dateModified: "2024-01-01",
          author: "CourseAI Team",
          url: "https://courseai.io/about",
        }}
      />

      {/* Page Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6">
            Revolutionizing Education
            <span className="block text-primary">with Artificial Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            CourseAI was founded with a simple mission: to make creating engaging,
            effective educational content accessible to everyone through the power of AI.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-black mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-6">
              We believe that quality education should not be limited by time, resources, or technical expertise.
              Our AI-powered platform empowers educators, content creators, and organizations to build
              comprehensive learning experiences with unprecedented ease and efficiency.
            </p>
            <p className="text-lg text-muted-foreground">
              By automating the complex process of course creation and quiz generation, we free educators
              to focus on what matters most: inspiring students and fostering genuine understanding.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black mb-6">What We Do</h2>
            <ul className="space-y-4 text-lg text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-black">•</span>
                <span>Generate complete video-based courses with AI assistance</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-black">•</span>
                <span>Create intelligent quizzes of multiple types automatically</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-black">•</span>
                <span>Track student progress with detailed analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-black">•</span>
                <span>Support multiple AI providers for optimal content generation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-background w-16 h-16 flex items-center justify-center font-black text-2xl mb-4 mx-auto">
                🎯
              </div>
              <h3 className="text-xl font-black mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                We leverage cutting-edge AI technology to solve real educational challenges.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-background w-16 h-16 flex items-center justify-center font-black text-2xl mb-4 mx-auto">
                🌍
              </div>
              <h3 className="text-xl font-black mb-3">Accessibility</h3>
              <p className="text-muted-foreground">
                Making powerful educational tools available to educators worldwide.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-background w-16 h-16 flex items-center justify-center font-black text-2xl mb-4 mx-auto">
                📈
              </div>
              <h3 className="text-xl font-black mb-3">Excellence</h3>
              <p className="text-muted-foreground">
                Committed to delivering high-quality, effective learning experiences.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-card border-4 border-border p-8 neo-shadow">
            <h2 className="text-3xl font-black mb-4">Join Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Be part of the educational revolution. Create better learning experiences with CourseAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/features"
                className="bg-primary text-background px-8 py-4 font-black uppercase tracking-wider border-4 border-border neo-hover-lift"
              >
                Explore Features
              </a>
              <a
                href="/contactus"
                className="border-4 border-border px-8 py-4 font-black uppercase tracking-wider neo-hover-lift"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}