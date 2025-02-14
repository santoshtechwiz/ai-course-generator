import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/authOptions";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import axios from "axios";
import type { CodingQuizProps } from "@/app/types/types";

import AnimatedQuizHighlight from "@/app/components/RanomQuiz";
import CodeQuizWrapper from "../components/CodeQuizWrapper";
import { Suspense } from "react";

import { QuizSkeleton } from "../../mcq/components/QuizSkeleton";

async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await axios.get<CodingQuizProps>(`${process.env.NEXTAUTH_URL}/api/code/${slug}`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch quiz data");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = (await params).slug;
  const quizData = await getQuizData(slug);

  // if (!quizData) {
  //   return notFound();
  // }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${quizData.quizData.title} Quiz`,
    description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
    openGraph: {
      title: `${quizData.quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.quizData.title)}`,
          width: 1200,
          height: 630,
          alt: `${quizData.quizData.title} Quiz`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${quizData.quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.quizData.title)}`],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getAuthSession();
  const slug = (await params).slug;

  return (

    <div className="py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 ">
            <Suspense fallback={<QuizSkeleton />}>
              <CodeQuizWrapper slug={slug} userId={session?.user?.id || ""} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
              <AnimatedQuizHighlight />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
