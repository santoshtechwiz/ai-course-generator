export const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "AI Course Generator",
    description: "Generate professional courses and quizzes with AI technology",
    provider: {
      "@type": "Organization",
      name: "Course AI",
      sameAs: process.env.NEXT_PUBLIC_SITE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      educationalLevel: "Beginner to Advanced",
      inLanguage: "en",
    },
    coursePrerequisites: "None",
    educationalLevel: "All",
    educationalUse: "Quiz Generation and Course Creation",
    interactivityType: "Interactive",
    learningResourceType: ["Course", "Quiz", "Assessment"],
  }
  
  