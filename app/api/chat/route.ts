import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getAuthSession } from "@/lib/authOptions";
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

type QuizType = "mcq" | "openended" | "fill-blanks" | "code";

const buildLinks = (quizType: QuizType, slug: string): string => {
  switch (quizType) {
    case "mcq":
      return `/mcq/${slug}`;
    case "openended":
      return `/openended/${slug}`;
    case "fill-blanks":
      return `/blanks/${slug}`;
    default:
      return `/code/${slug}`;
  }
};

function createQuery(userMessage: string, field: string) {
  return {
    where: {
      [field]: {
        contains: userMessage,
        mode: "insensitive" as const,
      },
    },
    take: 3,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const authSession = await getAuthSession();
    const userId = authSession?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userMessage = messages[messages.length - 1].content;
    console.log("User message:", userMessage);

    // First, try to find a matching category
    const category = await prisma.category.findFirst({
      where: {
        name: {
          contains: userMessage,
          mode: "insensitive",
        },
      },
    });

    let courses = [];
    let quizzes = [];

    if (category) {
      // If a category is found, fetch courses and quizzes for that category
      [courses, quizzes] = await Promise.all([
        prisma.course.findMany({
          where: { categoryId: category.id },
          take: 3,
        }),
        prisma.userQuiz.findMany({
        
          take: 3,
        }),
      ]);
    } else {
      // If no category is found, search courses and quizzes by name/topic
      [courses, quizzes] = await Promise.all([
        prisma.course.findMany(createQuery(userMessage, 'name')),
        prisma.userQuiz.findMany(createQuery(userMessage, 'topic')),
      ]);
    }

    console.log("Courses found:", courses);
    console.log("Quizzes found:", quizzes);

    let systemMessage: string;
    if (courses.length || quizzes.length) {
      systemMessage = `You are an AI assistant for a learning platform. The user asked about "${userMessage}". Here are relevant resources:

${category ? `**Category: ${category.name}**\n` : ''}

**Courses**:
${courses.map(c => `- [${c.name}](https://www.courseai.dev/dashboard/course/${c.slug})`).join("\n")}

**Quizzes**:
${quizzes.map(q => `- [${q.topic}](https://www.courseai.dev/dashboard/${buildLinks(q.quizType as QuizType, q.slug)})`).join("\n")}

Summarize their relevance and encourage exploration. Use markdown.`;
    } else {
      systemMessage = `No direct matches for "${userMessage}". Suggest creating content:

- [Create a Course](https://www.courseai.dev/dashboard/create/course)
- [Create a Quiz](https://www.courseai.dev/dashboard/create/quiz)

Encourage contribution. Use markdown.`;
    }

    console.log("System message:", systemMessage);

    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 250,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST function:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}