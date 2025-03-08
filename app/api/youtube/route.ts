import { Question } from "@/app/types/types";
import { prisma } from "@/lib/db";
import Semaphore from "@/lib/semaphore";


import { getQuestionsFromTranscript } from "@/services/videoProcessor";
import YoutubeService from "@/services/youtubeService";
import { NextResponse } from "next/server";



export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { videoId, chapterId, chapterName } = body;

    let questions = await getQuestionForChapter(chapterId);

    if (!questions || questions.length === 0) {
      const transcript = await fetchAndGenerateQuiz(videoId, chapterId, chapterName);
      questions = await getQuestionForChapter(chapterId);

      return NextResponse.json({ questions });
    }

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "An error occurred while processing your request." });
  }
}

async function fetchAndGenerateQuiz(
  videoId: string,
  chapterId: number,
  chapterName: string
): Promise<string> {
  try {
    const transcriptArr = await YoutubeService.fetchTranscript(videoId);

    if (!transcriptArr) return "";

    const transcript = transcriptArr.transcript;

    if (!transcript) return "";

    return await generateQuizInternal(transcript, chapterId, chapterName) ?? "";
  } catch (error: unknown) {
    console.error("An error occurred while generating quiz:", error);
    return "";
  }
}

async function generateQuizInternal(
  transcript: string,
  chapterId: number,
  chapterName: string
): Promise<string> {
  try {
    const maxLength = 500;
    transcript = transcript.split(" ").slice(0, maxLength).join(" ");

    const questions = await generateQuestion(transcript, chapterName);

    await prisma.courseQuiz.createMany({
      data: questions.map((question: Question) => {
        const options = [question.answer, ...question.options]
          .sort(() => Math.random() - 0.5);
        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          chapterId: chapterId,
        };
      }),
    });

    return transcript?.substring(0, 10);
  } catch (error: unknown) {
    console.error((error as Error).message);
    return "";
  }
}

async function generateQuestion(transcript: string, chapter: string): Promise<Question[]> {
  const semaphore = new Semaphore(3);
  try {
    await semaphore.acquire();
    return await getQuestionsFromTranscript(transcript, chapter);
  } catch (error: unknown) {
    console.error(error);
    return [];
  } finally {
    semaphore.release();
  }
}

async function getQuestionForChapter(chapterId: number): Promise<Question[]> {
  try {
    const questionsFromDb = await prisma.courseQuiz.findMany({ where: { chapterId } });
    return questionsFromDb.map((question) => {
      const options = JSON.parse(question.options);
      return {
        question: question.question,
        answer: question.answer,
        option1: options[0],
        option2: options[1],
        option3: options[2],
      };
    });
  } catch (error: unknown) {
    console.error((error as Error).message);
    return [];
  }
}
