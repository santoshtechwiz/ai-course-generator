
"use client";

import { CreateComponent } from "@/components/features/explore/CreateComponent";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { FAQSchema } from "@/lib/seo";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Suspense } from "react"
import { GlobalLoader } from "@/components/loaders/UnifiedLoader"

export default function ExplorePage() {
  // FAQ items for CourseAI explore page
  const faqItems = [
    {
      question: "How does CourseAI generate educational content?",
      answer: "CourseAI uses advanced artificial intelligence to analyze your topic and generate high-quality educational content including multiple-choice questions, open-ended questions, fill-in-the-blank exercises, and complete courses."
    },
    {
      question: "Can I create programming quizzes with CourseAI?",
      answer: "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others."
    },
    {
      question: "How accurate is the AI-generated content?",
      answer: "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements."
    },
    {
      question: "Can I customize the difficulty level of generated questions?",
      answer: "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives."
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <PageWrapper>
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Explore</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <PageHeader
          title="Explore AI-Powered Content Creation"
          description="Create professional-quality educational content in minutes with our AI tools."
        />

        <Suspense 
          fallback={
            <div className="w-full flex items-center justify-center min-h-[60vh]">
              <GlobalLoader />
            </div>
          }
        >
          <CreateComponent />
        </Suspense>
      </PageWrapper>
    </>
  );
}
