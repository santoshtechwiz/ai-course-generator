import { breadcrumbSchema } from "@/app/schema/breadcrumb-schema"
import { courseSchema } from "@/app/schema/course-schema"
import { quizSchema } from "@/app/schema/quiz-schema"

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Course AI Quiz Generator",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description: "AI-powered platform for creating quizzes, assessments, and educational content instantly",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "AI Quiz Generation",
              "Multiple Choice Questions",
              "True/False Questions",
              "Open-Ended Questions",
              "Video Quiz Creation",
              "PDF Quiz Generation",
              "Custom Templates",
              "Analytics Dashboard",
              "Automated Grading",
              "Question Bank",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1000",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(quizSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "How does the AI quiz generator work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Our AI analyzes your content (text, PDF, or video) and automatically generates relevant quiz questions, multiple choice options, and complete assessments in seconds.",
                },
              },
              {
                "@type": "Question",
                name: "What types of quizzes can I create?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You can create multiple-choice questions, true/false questions, open-ended questions, and complete assessments. The platform supports various content formats including text, PDF, and video.",
                },
              },
              {
                "@type": "Question",
                name: "Can I customize the generated quizzes?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, you can fully customize all generated quizzes. Edit questions, modify answers, adjust difficulty levels, and apply your own templates to match your specific needs.",
                },
              },
              {
                "@type": "Question",
                name: "How can I use Course AI for my classroom?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Course AI is perfect for classroom use. Create quizzes from your teaching materials, generate homework assignments, develop practice tests, and track student progress through our analytics dashboard.",
                },
              },
              {
                "@type": "Question",
                name: "Can I generate quizzes from videos?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Course AI can analyze video content and automatically generate relevant quizzes. Simply upload your video, and our AI will create questions based on the video content.",
                },
              },
            ],
          }),
        }}
      />
    </>
  )
}

