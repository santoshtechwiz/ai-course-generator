import CourseCreationVideo from "@/app/components/CourseCreationVideo";
import { prisma } from "@/lib/db";

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from "react";
import PlayQuiz from "../components/PlayQuiz";
import { QuizActions } from "../components/QuizActions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

type Question = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: { topic: true },
  });

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

  if (!quiz) {
    return {
      title: 'Quiz Not Found',
      description: 'The requested quiz could not be found.',
    };
  }

  const title = `${quiz.topic} Quiz`;
  const description = `Test your knowledge with this ${quiz.topic} quiz!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${websiteUrl}/quiz/${slug}`,
      type: 'website',
      images: [
        {
          url: `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.topic)}`,
          width: 1200,
          height: 630,
          alt: `${quiz.topic} Quiz Thumbnail`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${websiteUrl}/api/og?title=${encodeURIComponent(quiz.topic)}`],
    },
  };
}

export async function generateStaticParams() {
  const quizzes = await prisma.userQuiz.findMany({
    select: { slug: true },
  });

  return quizzes
    .filter((quiz) => quiz.slug)
    .map((quiz) => ({ slug: quiz.slug }));
}

const QuizPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params;
  const { slug } = params;

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await prisma.userQuiz.findUnique({
    where: { slug },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          answer: true,
        },
      },
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!result) {
    notFound();
  }

  const questions: Question[] = result.questions.map((question) => {
    let options: string[] = [];
    if (question.options) {
      try {
        options = JSON.parse(question.options);
      } catch (error) {
        console.error("Error parsing options:", error);
        options = ["Option 1", "Option 2", "Option 3"]; // Default fallback
      }
    }
    const [option1, option2, option3] = options;

    return {
      question: question.question,
      answer: question.answer,
      option1: option1 || "",
      option2: option2 || "",
      option3: option3 || "",
    };
  });

  const isOwner = currentUserId === result.user.id;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-col lg:flex-row w-full px-4 lg:px-8 py-8 space-y-8 lg:space-y-0 gap-8">
        <div className="flex-1 lg:flex-[3] w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">{result.topic} Quiz</h1>
            {isOwner && (
              <QuizActions
                quizId={result.id.toString()}
                quizSlug={result.slug}
                initialIsPublic={result.isPublic || false}
                initialIsFavorite={result.isFavorite || false}
              />
            )}
          </div>
          <PlayQuiz questions={questions} quizId={result.id} />
        </div>
        <div className="flex-1 overflow-hidden lg:flex-[1] w-full">
          <CourseCreationVideo />
        </div>
      </div>
    </Suspense>
  );
};

export default QuizPage;
