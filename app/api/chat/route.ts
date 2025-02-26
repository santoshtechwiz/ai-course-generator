import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getAuthSession } from "@/lib/authOptions";
import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CONFIG = {
  MIN_CREDITS_REQUIRED: 0,
  MAX_RESULTS: 5,
  TEMPERATURE: 0.5,
  MAX_TOKENS: 150,
  URL: process.env.NEXT_PUBLIC_URL,
};

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const authSession = await getAuthSession();
    const userId = authSession?.user?.id;

    if (!userId) {
      console.error("Unauthorized: No user ID found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userMessage = messages[messages.length - 1]?.content || "";
    if (!userMessage.trim()) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    console.log(`Processing request for user ${userId}: ${userMessage}`);

    // Extract keywords, intent, and requirements
    const analysisResult = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        {
          role: "system",
          content: "Extract key topics, user intent, and specific requirements. Format response as JSON: {topics: [], intent: '', requirements: []}. Be specific and include any mentioned difficulty levels or advanced concepts.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 100, // Increased to allow for more detailed analysis
    });

    let analysisText = '';
    for await (const chunk of analysisResult.textStream) {
      analysisText += chunk;
    }

    console.log("Analysis result:", analysisText);

    const analysis = safeParseAnalysis(analysisText);
    if (!analysis) {
      console.error("Failed to parse AI analysis");
      return new NextResponse("AI failed to analyze the query", { status: 500 });
    }

    // Fetch all courses and quizzes
    const [allCourses, allQuizzes] = await Promise.all([
      prisma.course.findMany({
        select: { name: true, slug: true, description: true },
      }),
      prisma.userQuiz.findMany({
        select: { topic: true, slug: true, quizType: true },
      }),
    ]);

    // Filter and rank courses and quizzes based on relevance
    const courses = rankContentByRelevance(allCourses, analysis, 'course');
    const quizzes = rankContentByRelevance(allQuizzes, analysis, 'quiz');

    console.log(`Found ${courses.length} relevant courses and ${quizzes.length} relevant quizzes`);

    // Build AI response message
    const systemMessage = buildSystemMessage(userMessage, courses, quizzes, analysis);

    const result = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      temperature: CONFIG.TEMPERATURE,
      maxTokens: CONFIG.MAX_TOKENS,
    });

    return result.toDataStreamResponse()

  } catch (error) {
    console.error("Error in API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper: Safe JSON Parsing
function safeParseAnalysis(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return null;
  }
}

function rankContentByRelevance(content: any[], analysis: any, type: 'course' | 'quiz') {
  const { topics, intent, requirements } = analysis;
  const allKeywords = [...topics, ...intent.split(' '), ...requirements.flatMap(r => r.split(' '))];
  
  return content
    .map(item => {
      const title = type === 'course' ? item.name : item.topic;
      const description = item.description || '';
      const contentText = `${title} ${description}`.toLowerCase();
      
      const relevanceScore = allKeywords.reduce((score, keyword) => {
        const keywordLower = keyword.toLowerCase();
        if (contentText.includes(keywordLower)) {
          score += contentText.split(keywordLower).length - 1;
        }
        return score;
      }, 0);

      return { ...item, relevanceScore };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, CONFIG.MAX_RESULTS);
}

function buildSystemMessage(userMessage: string, courses: any[], quizzes: any[], analysis: any): string {
  let message = `You are an AI assistant for our learning platform. Your task is to help users find relevant courses and quizzes or suggest creating new content if nothing suitable exists. The user's message is: "${userMessage}".\n\n`;

  if (analysis.intent) {
    message += `Based on your intent to "${analysis.intent}", here are some recommendations:\n\n`;
  }

  if (courses.length > 0 || quizzes.length > 0) {
    if (courses.length > 0) {
      message += "## Relevant Courses\n\n";
      courses.forEach(course => {
        message += `- [${course.name}](${CONFIG.URL}/dashboard/course/${course.slug})\n`;
        if (course.description) {
          message += `  ${course.description}\n`;
        }
      });
      message += "\n";
    }

    if (quizzes.length > 0) {
      message += "## Related Quizzes\n\n";
      quizzes.forEach(quiz => {
        message += `- [${quiz.topic}](${CONFIG.URL}/dashboard/${quiz.quizType}/${quiz.slug})\n`;
        if (quiz.description) {
          message += `  ${quiz.description}\n`;
        }
      });
      message += "\n";
    }

    message += "Would you like to access any of these resources?\n\n";
  } else {
    message += `I couldn't find any specific content related to your query. However, based on your intent and requirements, I can suggest creating new content on the following topics:\n\n`;
    
    const mainTopic = analysis.topics[0] || analysis.intent;
    const relatedTopics = generateRelatedTopics(analysis);

    message += `## Suggested Course Topics\n\n`;
    message += `1. [${mainTopic}](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(mainTopic)})\n`;
    relatedTopics.forEach((topic, index) => {
      message += `${index + 2}. [${topic}](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(topic)})\n`;
    });

    message += "\n## Create New Content\n\n";
    message += `- [Create a Course](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(mainTopic)})\n`;
    message += `- [Create a Quiz](${CONFIG.URL}/dashboard/quiz?topic=${encodeURIComponent(mainTopic)})\n\n`;
    
    message += "Would you like to create content on any of these topics? Or do you have a specific aspect you'd like to focus on?\n\n";
  }

  message += "## Additional Information\n\n";
  message += "Based on your intent, here are some key areas you might want to cover:\n\n";
  analysis.requirements.forEach((req: string) => {
    message += `- ${req}\n`;
  });

  message += "\nAlways maintain a helpful and encouraging tone. Provide guidance on how to get started with creating content if the user shows interest. Do not provide information about courses, quizzes, or content outside our platform.";

  return message;
}

function generateRelatedTopics(analysis: any): string[] {
  const topics: string[] = [];
  
  const mainTopic = analysis.topics[0] || analysis.intent;
  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Generate topics based on requirements and difficulty levels
  analysis.requirements.forEach((req: string) => {
    topics.push(`${mainTopic}: ${req}`);
  });
  
  difficultyLevels.forEach(level => {
    topics.push(`${level} ${mainTopic}`);
  });
  
  topics.push(`${mainTopic} in Practice`);
  topics.push(`${mainTopic} Case Studies`);
  
  // Ensure we have at least 5 topics
  while (topics.length < 5) {
    topics.push(`Exploring ${mainTopic} - Part ${topics.length + 1}`);
  }
  
  return topics.slice(0, 5); // Return at most 5 topics
}