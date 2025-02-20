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

    // Search for courses, quizzes, and categories
    const [courses, quizzes, categories] = await Promise.all([
      prisma.course.findMany(createQuery(userMessage, 'name')),
      prisma.userQuiz.findMany(createQuery(userMessage, 'topic')),
      prisma.category.findMany(createQuery(userMessage, 'name')),
    ]);

    console.log("Courses found:", courses);
    console.log("Quizzes found:", quizzes);
    console.log("Categories found:", categories);

    let systemMessage: string;
    if (courses.length || quizzes.length || categories.length) {
      systemMessage = `You are an AI assistant for a learning platform. Your responses must strictly reference content available on our website. The user asked about "${userMessage}". Here are relevant resources:

${categories.length ? `**Related Categories**:\n${categories.map(c => `- ${c.name}`).join("\n")}\n` : ''}

${courses.length ? `**Relevant Courses**:\n${courses.map(c => `- [${c.name}](https://www.courseai.dev/dashboard/course/${c.slug})`).join("\n")}\n` : ''}

${quizzes.length ? `**Related Quizzes**:\n${quizzes.map(q => `- [${q.topic}](https://www.courseai.dev/dashboard/${buildLinks(q.quizType as QuizType, q.slug)})`).join("\n")}\n` : ''}

Summarize the relevance of these resources to the user's query. Encourage exploration of the courses and quizzes within our platform. Do not suggest or reference any external resources. If the results don't fully address the user's question, suggest creating new content on our platform. Use markdown formatting.`;
    } else {
      systemMessage = `You are an AI assistant for a learning platform. Your responses must strictly reference content available on our website. The user asked about "${userMessage}", but we don't have any direct matches in our courses or quizzes. Your task is to:

1. Acknowledge that we don't have specific content on this topic yet.
2. Suggest how this topic might relate to software development or programming if applicable.
3. Encourage the user to create their own content on this topic using our platform:
   - [Create a Course](https://www.courseai.dev/dashboard/create/course)
   - [Create a Quiz](https://www.courseai.dev/dashboard/create/quiz)

Do not suggest or reference any external resources. Use markdown formatting in your response.`;
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