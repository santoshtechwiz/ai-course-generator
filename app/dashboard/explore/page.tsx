"use client";

import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FAQSchema } from "@/lib/seo";
import { motion, AnimatePresence } from "framer-motion";
import { AppLoader } from "@/components/ui/loader";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Simple, clean loading component using AppLoader
function ExploreLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-[60vh] flex flex-col items-center justify-center w-full"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 blur-xl animate-pulse" />
          <AppLoader
            size="large"
            className="relative z-10"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center space-y-2 max-w-md"
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-lg font-semibold text-foreground"
          >
            Preparing AI Tools
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-sm text-muted-foreground"
          >
            Setting up intelligent content creation tools for your learning journey
          </motion.p>
        </motion.div>

        {/* Animated progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Dynamically load the explore component with clean loading
const CreateComponent = dynamic(
  () =>
    import("@/components/features/explore/CreateComponent").then((m) => m.CreateComponent),
  {
    ssr: false,
    loading: () => <ExploreLoadingState />,
  }
);

export default function ExplorePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate page load completion
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // FAQ items for CourseAI explore page
  const faqItems = [
    {
      question: "How does CourseAI generate educational content?",
      answer:
        "CourseAI helps you create courses using YouTube videos and generate intelligent quizzes. Add YouTube video links, organize them into chapters, and use AI to automatically generate quizzes from video transcripts.",
    },
    {
      question: "Can I create programming quizzes with CourseAI?",
      answer:
        "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others.",
    },
    {
      question: "How accurate is the AI-generated content?",
      answer:
        "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements.",
    },
    {
      question: "Can I customize the difficulty level of generated questions?",
      answer:
        "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives.",
    },
  ];

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const breadcrumbVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.2,
      },
    },
  };

  return (
    <>
      <FAQSchema items={faqItems} />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="min-h-screen relative"
      >
        {/* Subtle background animation with current theme */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </motion.div>

        <PageWrapper>
          <motion.div
            variants={breadcrumbVariants}
            className="mb-6"
          >
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
          </motion.div>

          <motion.div
            variants={contentVariants}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key="explore-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <CreateComponent />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </PageWrapper>
      </motion.div>
    </>
  );
}
