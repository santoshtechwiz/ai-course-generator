import { getAuthSession } from "@/lib/authOptions";
import { generateFlashCards } from "@/lib/chatgpt/ai-service";
import prisma from "@/lib/db";
import { titleToSlug } from "@/lib/slug";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { topic, count } = await req.json();
  const session = await getAuthSession();
  const slug = titleToSlug(topic);
  if (!topic) {
    return NextResponse.json({ error: "You must provide a topic." }, { status: 400 });
  }

  if (!session) {
    return NextResponse.json({ error: "You must be authenticated to create flashcards." }, { status: 401 });
  }

  try {
    const flashcards = await generateFlashCards(topic, count);

    // Create a new topic and save flashcards
    const newTopic = await prisma.userQuiz.create({
      data: {
        topic,
        quizType: "flashcard",
        slug: topic.toLowerCase().replace(/ /g, "-"),
        timeStarted: new Date(),
        user: { connect: { id: session.user.id } },
        FlashCard: {
          create: flashcards.map((flashcard: any) => ({
            question: flashcard.question,
            answer: flashcard.answer,
            user: { connect: { id: session.user.id } },
          })),
        },
      },
    });

    return NextResponse.json({ newTopic }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate flash cards." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "You must be authenticated to view flashcards." }, { status: 401 })
    }

    const whereClause = {
      userId: session.user.id,
      ...(slug ? { slug: slug } : {}),
    }
    const quizId = await prisma.userQuiz.findUnique
      ({
        where: {
          slug: slug || "",
        },
        select: {
          id: true,
        }
      });

    const flashcards = await prisma.flashCard.findMany({
      where: { userQuizId: quizId?.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ flashcards }, { status: 200 })
  } catch (error) {
    console.error("Error fetching flashcards:", error)
    return NextResponse.json({ error: "Failed to fetch flashcards" }, { status: 500 })
  }
}
