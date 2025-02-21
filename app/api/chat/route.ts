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

function extractKeywords(userMessage: string): { type: 'course' | 'quiz' | 'both', topic: string } {
  const lowerCaseMessage = userMessage.toLowerCase();
  const isCourseQuery = lowerCaseMessage.includes('course');
  const isQuizQuery = lowerCaseMessage.includes('quiz');

  // Extract the topic by removing the query type words
  const topic = lowerCaseMessage
    .replace(/course|quiz|do you have|any|on/gi, '')
    .trim();

  return {
    type: isCourseQuery && isQuizQuery ? 'both' : isCourseQuery ? 'course' : isQuizQuery ? 'quiz' : 'both',
    topic,
  };
}

function createQuery(topic: string, field: string) {
  return {
    where: {
      [field]: {
        contains: topic,
        mode: "insensitive" as const,
      },
    },
    take: 5, // Increased to get more relevant results
  };
}

function createCategoryQuery(topic: string) {
  return {
    where: {
      name: {
        contains: topic,
        mode: "insensitive" as const,
      },
    },
    select: {
      id: true,
    },
  };
}

function parsePhrase(topic: string) {
  const words = topic.split(' ');
  return words.map(word => ({
    name: {
      contains: word,
      mode: "insensitive" as const,
    },
  }));
}

function createCourseQuery(topic: string) {
  return {
    where: {
      OR: parsePhrase(topic),
    },
    take: 5,
  };
}

function createQuizQuery(topic: string) {
  return {
    where: {
      OR: parsePhrase(topic),
    },
    take: 5,
  };
}

function suggestRelatedTopics(topic: string): string[] {
  return [
    `${topic} fundamentals`,
    `Advanced ${topic}`,
    `${topic} best practices`,
    `${topic} for beginners`,
    `${topic} interview questions`,
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const authSession = await getAuthSession();
    const userId = authSession?.user?.id;

    if (!userId || (authSession?.user?.credits ?? 0) < 3) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userMessage = messages[messages.length - 1].content;
    console.log("User message:", userMessage);

    const { type, topic } = extractKeywords(userMessage);
    console.log("Extracted type and topic:", type, topic);

    // Search for category ID
    const category = await prisma.category.findFirst(createCategoryQuery(topic));
    const categoryId = category?.id;

    // Search for courses and quizzes based on the type
    const [coursesByName, coursesByCategory, quizzes] = await Promise.all([
      type !== 'quiz' ? prisma.course.findMany(createCourseQuery(topic)) : [],
      type !== 'quiz' && categoryId ? prisma.course.findMany({ where: { categoryId } }) : [],
      type !== 'course' ? prisma.userQuiz.findMany(createQuery(topic, 'topic')) : [],
    ]);

    // Merge courses
    const courses = [...new Set([...coursesByName, ...coursesByCategory])];

    console.log("Courses found:", courses);
    console.log("Quizzes found:", quizzes);

    let systemMessage: string;
    if (courses.length || quizzes.length) {
      systemMessage = `Here are relevant resources for "${topic}":

${courses.length ? `**Courses**:\n${courses.map(c => `- [${c.name}](https://www.courseai.dev/dashboard/course${c.slug})`).join("\n")}\n` : ''}

${quizzes.length ? `**Quizzes**:\n${quizzes.map(q => `- [${q.topic}](https://www.courseai.dev/dashboard${buildLinks(q.quizType as QuizType, q.slug)})`).join("\n")}\n` : ''}

Explore these resources to learn more.`;
    } else {
      const suggestedTopic = suggestRelatedTopics(topic)[0];
      systemMessage = `We don't have specific content on "${topic}". 

Why not create a course or quiz on "${suggestedTopic}"?

- [Create a Course](https://courseai.dev/dashboard/create)
- [Create a Quiz](https://courseai.dev/dashboard/quiz)`;
    }

    console.log("System message:", systemMessage);

    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 150,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in POST function:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}