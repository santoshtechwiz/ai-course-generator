import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Trie } from '@/lib/trie';

let courseTrie: Trie | null = null;

async function initializeTrie() {
  if (courseTrie) return;

  courseTrie = new Trie();
  const courses = await prisma.course.findMany({
    select: { id: true, name: true },
  });

  courses.forEach((course) => {
    courseTrie!.insert(course.name, course.id);
  });

  console.log('Trie initialized with courses data.');
}

export async function GET(request: Request) {
  await initializeTrie();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    // Search for matching course IDs using the Trie
    const courseIds = courseTrie!.search(query);
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Improved search for quizzes (previously called games)
    const quizzes = await prisma.userQuiz.findMany({
      where: {
        OR: [
          { topic: { contains: query, mode: 'insensitive' } },

          {
            questions: {
              some: {
                OR: [
                  { question: { contains: query, mode: 'insensitive' } },
                  { answer: { contains: query, mode: 'insensitive' } },

                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        topic: true,
        slug: true,
        quizType:true,
        questions: {
          select: {
            id: true,
            question: true,

          },
          take: 1, // Include only the first question as a preview
        },
      },
    });

    return NextResponse.json({
      courses,
      quizzes: quizzes.map(quiz => ({
        ...quiz,
        questionPreview: quiz.questions[0]?.question || null,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'An error occurred while searching' }, { status: 500 });
  }
}

