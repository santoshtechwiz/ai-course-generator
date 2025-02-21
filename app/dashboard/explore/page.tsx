
import { CreateComponent } from "./components/CreateComponent";
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explore AI-Powered Course Creation Tools",
  description:
    "Discover our suite of AI-powered tools for creating MCQs, open-ended questions, fill-in-the-blank exercises, and full courses. Revolutionize your teaching with Course AI.",
  keywords: ["AI course creation", "MCQ generator", "open-ended questions", "fill in the blank", "e-learning tools"],
  openGraph: {
    title: "AI-Powered Course Creation Tools",
    description: "Create engaging courses, MCQs, open-ended questions, and more with our AI-powered tools.",
    images: [{ url: "/og-image-explore.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore AI Course Creation Tools",
    description: "Revolutionize your teaching with our AI-powered course creation tools.",
    images: ["/twitter-image-explore.jpg"],
  },
}
export default function ExplorePage() {
  return <CreateComponent />;
}
