"use server";
import prisma from "@/lib/db";
import { Question } from "../types/types";

// Define return type
export interface McqQuestionsResponse {
  result: {
    id: number;
    topic: string;
    slug: string;
    isPublic: boolean;
    isFavorite: boolean;
    userId: string;
    user: { id: string };
  } | null;
  questions: Question[];
}

const getMcqQuestions = async (slug: string): Promise<McqQuestionsResponse> => {
  const result = await prisma.userQuiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublic: true,
      isFavorite: true,
      userId: true,
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

  // Handle case where no result is found
  if (!result) {
    return { result: null, questions: [] };
  }

  // Convert `questions` field to match `Question[]` type
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
      id: question.id,
      question: question.question,
      answer: question.answer,
      option1: option1 || "",
      option2: option2 || "",
      option3: option3 || "",
    };
  });

  return { result, questions };
};

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const { slug } = params

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: { id: true, title: true, questions: true, user: { select: { name: true } } },
  })

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"

  if (!quiz) {
    return {
      title: "Quiz Not Found",
      description: "The requested quiz could not be found.",
    }
  }

  const title = `${quiz.title} Quiz `
  const description = `Test your knowledge with this ${quiz.title} quiz created by ${quiz.user.name}. Challenge yourself and learn something new!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${websiteUrl}/quiz/${slug}`,
      type: "website",
      images: [
        {
          url: `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}`,
          width: 1200,
          height: 630,
          alt: `${quiz.title} Quiz Thumbnail`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}`],
    },
    alternates: {
      canonical: `${websiteUrl}/quiz/${slug}`,
    },
  }
}

export default getMcqQuestions;
