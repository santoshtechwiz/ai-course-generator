"use client";

import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { DashboardWrapper } from "@/components/dashboard/DashboardWrapper";
import { useLoading } from "@/hooks/useLoading";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { FAQSchema } from "@/lib/seo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Reusable skeleton (can be extracted globally if reused elsewhere)
function ExploreSkeleton(){
  return (
    <div className="min-h-[70vh] flex items-center justify-center w-full animate-in fade-in" aria-busy="true" aria-live="polite" role="status">
      <div className="relative w-full max-w-4xl flex flex-col items-center px-4">
        <div className="relative w-56 h-56 mb-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-purple-400/20 blur-2xl animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-primary/30 backdrop-blur-sm" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold tracking-wide shadow-lg shadow-primary/30">
            AI
          </div>
          <div className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-purple-500/80 shadow-sm shadow-primary/40 orbit-slow" />
          <div className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 shadow-sm shadow-fuchsia-500/40 orbit-med" />
          <div className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-sm shadow-emerald-500/40 orbit-fast" />
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow pointer-events-none" />
        </div>
        <p className="text-sm text-muted-foreground mb-6 font-medium tracking-wide">
          Generating intelligent creation tools…
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative h-48 rounded-xl border border-border/40 bg-gradient-to-br from-muted/70 via-muted/40 to-muted/20 overflow-hidden">
              <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="relative h-full flex flex-col p-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/25 animate-[pulse_2.2s_ease-in-out_infinite]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-primary/20 animate-[pulse_2.1s_ease-in-out_infinite]" />
                    <div className="h-2.5 w-1/2 rounded bg-primary/15 animate-[pulse_2.4s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="space-y-2 mt-1">
                  <div className="h-2.5 w-full rounded bg-primary/10 animate-[pulse_2.3s_ease-in-out_infinite]" />
                  <div className="h-2.5 w-11/12 rounded bg-primary/10 animate-[pulse_2.5s_ease-in-out_infinite]" />
                  <div className="h-2.5 w-4/5 rounded bg-primary/10 animate-[pulse_2.7s_ease-in-out_infinite]" />
                </div>
                <div className="mt-auto h-8 w-full rounded-md bg-primary/15 animate-[pulse_2.6s_ease-in-out_infinite]" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .orbit-slow { top: 0; left: 50%; transform: translate(-50%, -50%); animation: orbit 9s linear infinite; }
        .orbit-med { top: 50%; left: 100%; transform: translate(-50%, -50%); animation: orbit 6s linear infinite reverse; }
        .orbit-fast { top: 100%; left: 50%; transform: translate(-50%, -50%); animation: orbit 4s linear infinite; }
        @keyframes orbit {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(90px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) rotate(180deg) translateX(90px) rotate(-180deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        .animate-spin-slow { animation: spin 18s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// Dynamically load heavy explore UI client-side only
const CreateComponent = dynamic(
  () => import("@/components/features/explore/CreateComponent").then(m => m.CreateComponent),
  { ssr: false, loading: () => <ExploreSkeleton /> }
)

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

        <CreateComponent className="mt-4" />
      </PageWrapper>
    </>
  );
}
