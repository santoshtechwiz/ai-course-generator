import { CodingQuizProps } from "@/app/types";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: { slug: string } }): Promise<NextResponse> {
  const { slug } = props.params;
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const result = await prisma.userQuiz.findUnique({
      where: {
        slug: slug
      },
      select: {
       isFavorite: true,
         isPublic: true,
         topic: true,
        questions: {
          select: {
            question: true,
            options: true,
            codeSnippet: true,
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quizData: CodingQuizProps = {
      quizData: {
        title: result.topic,
        questions: result.questions.map(q => ({
          question: q.question,
          options: q.options ? JSON.parse(q.options) : [],
          codeSnippet: q.codeSnippet
        }))
      }
    };

    return NextResponse.json(quizData.quizData);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}