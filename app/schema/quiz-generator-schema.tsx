export const quizGeneratorSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CourseAI",
  applicationCategory: "EducationalApplication",
  description: "AI-powered quiz and course generation platform for educators",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  features: [
    {
      "@type": "PropertyValue",
      name: "Quiz Generation",
      value: "Generate quizzes from any content automatically",
    },
    {
      "@type": "PropertyValue",
      name: "Multiple Question Types",
      value: "Create various types of questions including multiple choice, true/false, and open-ended",
    },
    {
      "@type": "PropertyValue",
      name: "Course Creation",
      value: "Build complete courses with integrated assessments",
    },
    {
      "@type": "PropertyValue",
      name: "Analytics",
      value: "Track student performance and quiz effectiveness",
    },
  ],
  educationalUse: ["Assessment", "Quiz", "Course", "Training"],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: ["Teacher", "Instructor", "Trainer", "Student"],
  },
}
