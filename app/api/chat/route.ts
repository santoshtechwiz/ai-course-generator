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
    take: 5, // Increased to get more relevant results
  };
}

function createCategoryQuery(userMessage: string) {
  return {
    where: {
      name: {
        contains: userMessage,
        mode: "insensitive" as const,
      },
    },
    select: {
      id: true,
    },
  };
}

function createCourseQuery(userMessage: string) {
  return {
    where: {
      name: {
        contains: userMessage,
        mode: "insensitive" as const,
      },
    },
    take: 5,
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

    // Search for category ID
    const category = await prisma.category.findFirst(createCategoryQuery(userMessage));
    const categoryId = category?.id;

    // Search for courses and quizzes
    const [coursesByName, coursesByCategory, quizzes] = await Promise.all([
      prisma.course.findMany(createCourseQuery(userMessage)),
      categoryId ? prisma.course.findMany({ where: { categoryId } }) : [],
      prisma.userQuiz.findMany(createQuery(userMessage, 'topic')),
    ]);

    // Merge courses
    const courses = [...new Set([...coursesByName, ...coursesByCategory])];

    console.log("Courses found:", courses);
    console.log("Quizzes found:", quizzes);

    let systemMessage: string;
    if (courses.length || quizzes.length) {
      systemMessage = `You are an AI assistant for a learning platform. The user asked about "${userMessage}". Here are relevant resources:

${courses.length ? `**Courses**:\n${courses.map(c => `- [${c.name}](https://www.courseai.dev/dashboard/course/${c.slug})`).join("\n")}\n` : ''}

${quizzes.length ? `**Quizzes**:\n${quizzes.map(q => `- [${q.topic}](https://www.courseai.dev/dashboard/${buildLinks(q.quizType as QuizType, q.slug)})`).join("\n")}\n` : ''}

Summarize the relevance of these resources. Encourage exploration within our platform. Do not reference external resources. If results are insufficient, suggest creating new content. Use markdown.`;
    } else {
      systemMessage = `You are an AI assistant for a learning platform. The user asked about "${userMessage}", but we don't have specific content. 

1. Acknowledge the lack of content.
2. Suggest creating content on our platform:
   - [Create a Course](https://courseai.dev/dashboard/create)
   - [Create a Quiz](https://courseai.dev/dashboard/quiz)

Do not reference external resources. Use markdown.`;
    }

    console.log("System message:", systemMessage);

    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 150, // Adjusted to optimize token usage
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST function:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}