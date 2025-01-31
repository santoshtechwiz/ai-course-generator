import { createQuestions, createUserQuiz, prisma, updateTopicCount, updateUserCredits } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { MultipleChoiceQuestion, OpenEndedQuestion, QuizType } from "@/app/types";
import { getAuthSession } from "@/lib/authOptions";
import { quizCreationSchema } from "@/schema/schema";
import { generateSlug } from "@/lib/utils";
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const dynamic = "force-dynamic";

// async function createUserQuiz(userId: string, topic: string, type: string, slug: string) {
//   let uniqueSlug = slug;
//   let counter = 1;

//   while (true) {
//     try {
//       return await prisma.userQuiz.create({
//         data: {
//           quizType: type,
//           timeStarted: new Date(),
//           userId,
//           isPublic: false,
//           topic,
//           slug: uniqueSlug,
//         },
//       });
//     } catch (error: any) {
//       if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
//         uniqueSlug = `${slug}-${counter}`;
//         counter++;
//       } else {
//         throw error;
//       }
//     }
//   }
// }

// async function createQuestions(questions: MultipleChoiceQuestion[] | OpenEndedQuestion[], userQuizId: number, type: QuizType) {
//   const data = questions.map((question) => {
//     if (type === 'mcq') {
//       const mcqQuestion = question as MultipleChoiceQuestion;
//       const options = [mcqQuestion.answer, mcqQuestion.option1, mcqQuestion.option2, mcqQuestion.option3].sort(() => Math.random() - 0.5);
//       return {
        
//         question: mcqQuestion.question,
//         answer: mcqQuestion.answer,
//         options: JSON.stringify(options),
//         userQuizId,
//         questionType: "mcq" as const,
//       };
//     } else {
//       const openEndedQuestion = question as OpenEndedQuestion;
//       return {
//         question: openEndedQuestion.question,
//         answer: openEndedQuestion.answer,
//         userQuizId,
//         questionType: "openended" as const,
//       };
//     }
//   });

//   await prisma.userQuizQuestion.createMany({ data });
// }

// async function updateTopicCount(topic: string) {
//   return prisma.topicCount.upsert({
//     where: { topic },
//     create: { topic, count: 1 },
//     update: { count: { increment: 1 } },
//   });
// }
// async function updateUserCredits(userId: string, type: QuizType): Promise<void> {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     include: { subscriptions: true },
//   });

//   if (!user) {
//     throw new Error(`User with id ${userId} not found`);
//   }

//   if (user.credits <= 0) {
//     throw new Error("User does not have enough credits");
//   }

//   await prisma.user.update({
//     where: { id: userId },
//     data: { credits: { decrement: 1 } },
//   });
// }

async function fetchQuizQuestions(amount: number, topic: string, type: QuizType, difficulty: string,userType) {
  const { data } = await axios.post<MultipleChoiceQuestion[] | OpenEndedQuestion[]>(
    `${process.env.NEXTAUTH_URL}/api/quiz`,
    { amount, topic, type, difficulty,userType },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}



export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a quiz." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { topic, type, amount, difficulty,userType } = quizCreationSchema.parse(body);
    const slug = generateSlug(topic);

    // 1. First fetch questions to ensure we can create a quiz
    const questions = await fetchQuizQuestions(amount, topic, type, difficulty,userType);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions were generated for the given topic." },
        { status: 400 }
      );
    }

    // 2. Create the user quiz
    const userQuiz = await createUserQuiz(session.user.id, topic, type, slug);

    try {
      // 3. Create questions for the quiz
      await createQuestions(questions, userQuiz.id, type);

      // 4. Update topic count
      await updateTopicCount(topic);

      // 5. Only deduct credits if everything else succeeded
      await updateUserCredits(session.user.id, type);

      return NextResponse.json({
        userQuizId: userQuiz.id,
        slug: userQuiz.slug
      }, { status: 200 });
    } catch (error) {
      // If anything fails after quiz creation, try to delete the quiz
      await prisma.userQuiz.delete({
        where: { id: userQuiz.id }
      }).catch(() => {
        // Ignore deletion errors
        console.error('Failed to cleanup quiz after error:', userQuiz.id);
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Quiz creation error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view a quiz." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const userQuizId = url.searchParams.get("userQuizId");

    if (!userQuizId) {
      return NextResponse.json(
        { error: "You must provide a user quiz ID." },
        { status: 400 }
      );
    }

    const cacheKey = `userQuiz_${userQuizId}`;
    const cachedUserQuiz = cache.get(cacheKey);

    if (cachedUserQuiz) {
      return NextResponse.json({ userQuiz: cachedUserQuiz }, { status: 200 });
    }

    const userQuiz = await prisma.userQuiz.findUnique({
      where: { id: Number(userQuizId) },
      select: {
        slug: true,
        id: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
            options: true,
            userQuizId: true,
          },
        },
      },
    });

    if (!userQuiz) {
      return NextResponse.json(
        { error: "User quiz not found." },
        { status: 404 }
      );
    }

    const parsedQuestions = userQuiz.questions.map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
    }));

    const userQuizData = { ...userQuiz, questions: parsedQuestions };
    cache.set(cacheKey, userQuizData);

    return NextResponse.json({ userQuiz: userQuizData }, { status: 200 });
  } catch (error) {
    console.error('User quiz retrieval error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

