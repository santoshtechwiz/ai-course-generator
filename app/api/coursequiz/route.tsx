import { getTranscriptForVideo } from "@/app/actions/youtubeTranscript";
import { prisma } from "@/lib/db";
import { getQuestionsFromTranscript } from "@/services/videoProcessor";
import { NextResponse } from "next/server";
import NodeCache from "node-cache";

// Initialize cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { videoId, chapterId, chapterName } = await req.json();
    console.log("Received request:", { videoId, chapterId, chapterName });

    if (!videoId || !chapterId || !chapterName) {
      return NextResponse.json(
        { error: "Invalid request: Missing required fields" },
        { status: 400 }
      );
    }

    const cacheKey = `questions_${chapterId}_${videoId}`;
    let questions = cache.get<any[]>(cacheKey);

    if (!questions || questions.length === 0) {
      questions = await getQuestionsFromChapter(chapterId);
      
      if (questions.length === 0) {
        const transcriptOrSummary = await fetchTranscriptOrSummary(chapterId, videoId);
        if (transcriptOrSummary) {
          questions = await generateAndSaveQuestions(transcriptOrSummary, chapterId, chapterName);
        } else {
          return NextResponse.json(
            { error: "Failed to fetch transcript or summary" },
            { status: 500 }
          );
        }
      }

      if (questions.length > 0) {
        cache.set(cacheKey, questions);
      }
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}

async function fetchTranscriptOrSummary(chapterId: number, videoId: string): Promise<string | null> {
  try {
    // First, check if a summary exists for the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { summary: true }
    });

    if (chapter && chapter.summary) {
      console.log("Returning existing summary for chapter:", chapterId);
      return chapter.summary;
    }

    // If no summary exists, fetch the transcript
    console.log("Fetching transcript for video:", videoId);
    const transcriptArr = await getTranscriptForVideo(videoId);

    if (!transcriptArr || transcriptArr?.transcript.length === 0) {
      console.error("Failed to fetch transcript");
      return null;
    }

    const transcript = transcriptArr?.transcript;
    return transcript || null;
  } catch (error) {
    console.error("Error in fetchTranscriptOrSummary:", error);
    return null;
  }
}

// The rest of the functions (generateAndSaveQuestions and getQuestionsFromChapter) remain unchanged

async function generateAndSaveQuestions(transcriptOrSummary: string, chapterId: number, chapterName: string): Promise<any[]> {
  const maxLength = 500;
  const truncatedText = transcriptOrSummary.split(" ").slice(0, maxLength).join(" ");

  console.log("Generating questions for text");
  const questions = await getQuestionsFromTranscript(truncatedText, chapterName);

  if (questions.length > 0) {
    console.log("Saving questions to database");
    await prisma.courseQuiz.createMany({
      data: questions.map((question: any) => {
        const uniqueOptions = question.options.includes(question.answer) 
          ? question.options 
          : [...question.options, question.answer];
        
        const sortedOptions = uniqueOptions.sort(() => Math.random() - 0.5);
        
        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(sortedOptions),
          chapterId: chapterId,
        };
      }),
    });
  }

  return questions;
}

async function getQuestionsFromChapter(chapterId: number): Promise<any[]> {
  try {
    console.log("Fetching questions for chapter:", chapterId);
    const questions = await prisma.courseQuiz.findMany({
      where: { chapterId: chapterId },
    });
    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options as string)
    }));
  } catch (error) {
    console.error("Error in getQuestionsFromChapter:", error);
    return [];
  }
}

