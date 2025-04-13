import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CourseAI - Programming Education Platform",
    short_name: "CourseAI",
    description:
      "Revolutionize your coding education with our AI-powered course creation and personalized programming learning platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    "icons": [
      {
        "src": "/favicon.ico",
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      }
    ],
    categories: ["education", "technology", "programming", "development"],
    related_applications: [
      {
        platform: "web",
        url: "https://courseai.io",
        id: "course-ai",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        label: "CourseAI Dashboard",
      },
      {
        src: "/screenshots/course-view.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Interactive Course View",
      },
      {
        src: "/screenshots/quiz-creator.png",
        sizes: "1280x720",
        type: "image/png",
        label: "AI Quiz Creator",
      },
    ],
  }
}

