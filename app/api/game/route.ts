import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { MCQQuestion, OpenEndedQuestion, QuizType } from "@/app/types";
import { getAuthSession } from "@/lib/authOptions";
import { quizCreationSchema } from "@/schema/schema";
import { generateSlug } from "@/lib/utils";
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const dynamic = "force-dynamic";

async function createGame(userId: string, topic: string, type: string, slug: string, questionCount: number) {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    try {
      return await prisma.userQuiz.create({
        data: {
          gameType: type,
          timeStarted: new Date(),
          userId,
          isPublic: false,
          topic,
          slug: uniqueSlug,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      } else {
        throw error;
      }
    }
  }
}

async function createQuestions(questions: MCQQuestion[] | OpenEndedQuestion[], gameId: number, type: QuizType) {
  const data = questions.map((question) => {
    if (type === 'mcq') {
      const mcqQuestion = question as MCQQuestion;
      const options = [mcqQuestion.answer, mcqQuestion.option1, mcqQuestion.option2, mcqQuestion.option3].sort(() => Math.random() - 0.5);
      return {
        question: mcqQuestion.question,
        answer: mcqQuestion.answer,
        options: JSON.stringify(options),
        gameId,
        questionType: "mcq" as const,
      };
    } else {
      const openEndedQuestion = question as OpenEndedQuestion;
      return {
        question: openEndedQuestion.question,
        answer: openEndedQuestion.answer,
        gameId,
        questionType: "open-ended" as const,
      };
    }
  });

  await prisma.quiz.createMany({ data });
}

async function updateTopicCount(topic: string) {
  return prisma.topicCount.upsert({
    where: { topic },
    create: { topic, count: 1 },
    update: { count: { increment: 1 } },
  });
}

async function fetchQuizQuestions(amount: number, topic: string, type: QuizType, difficulty: string) {
  const { data } = await axios.post<MCQQuestion[] | OpenEndedQuestion[]>(
    `${process.env.NEXTAUTH_URL}/api/quiz`,
    { amount, topic, type, difficulty },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

async function updateUserCredits(userId: string, type: QuizType): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptions: true },
  });

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  if (user.credits <= 0) {
    throw new Error("User does not have enough credits");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: 1 } },
  });
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { topic, type, amount, difficulty } = quizCreationSchema.parse(body);
    const slug = generateSlug(topic);

    // 1. First fetch questions to ensure we can create a game
    const questions = await fetchQuizQuestions(amount, topic, type, difficulty);
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions were generated for the given topic." },
        { status: 400 }
      );
    }

    // 2. Create the game
    const game = await createGame(session.user.id, topic, type, slug, questions.length);

    try {
      // 3. Create questions for the game
      await createQuestions(questions, game.id, type);

      // 4. Update topic count
      await updateTopicCount(topic);

      // 5. Only deduct credits if everything else succeeded
      await updateUserCredits(session.user.id, type);

      return NextResponse.json({
        gameId: game.id,
        slug: game.slug
      }, { status: 200 });
    } catch (error) {
      // If anything fails after game creation, try to delete the game
      await prisma.userQuiz.delete({
        where: { id: game.id }
      }).catch(() => {
        // Ignore deletion errors
        console.error('Failed to cleanup game after error:', game.id);
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
        { error: "You must be logged in to view a game." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game ID." },
        { status: 400 }
      );
    }

    const cacheKey = `game_${gameId}`;
    const cachedGame = cache.get(cacheKey);

    if (cachedGame) {
      return NextResponse.json({ game: cachedGame }, { status: 200 });
    }

    const game = await prisma.userQuiz.findUnique({
      where: { id: Number(gameId) },
      select: {
        slug: true,
        questions: {
          select: {
            id: true,
            question: true,
            answer: true,
            options: true,
            gameId: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        { status: 404 }
      );
    }

    const parsedQuestions = game.questions.map((question) => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
    }));

    const gameData = { ...game, questions: parsedQuestions };
    cache.set(cacheKey, gameData);

    return NextResponse.json({ game: gameData }, { status: 200 });
  } catch (error) {
    console.error('Game retrieval error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

