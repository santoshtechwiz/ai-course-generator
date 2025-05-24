import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQuiz } from "@/app/actions/getQuiz";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;
    const { slug } = params;

    // Get quiz data
    const quizData = await getQuiz(slug);

    if (!quizData) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Process the quiz data to ensure it has the expected structure
    const processedQuizData = {
      id: quizData.id || slug,
      slug,
      type: "blanks",
      title: quizData.title || "Fill in the Blanks Quiz",
      description: quizData.description || "",
      questions: Array.isArray(quizData.questions) ? quizData.questions : [],
      userId: quizData.userId || session?.user?.id || "anonymous"
    };

    return NextResponse.json(processedQuizData);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
