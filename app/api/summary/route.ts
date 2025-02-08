import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import PQueue from 'p-queue';

import {  generateVideoSummary } from "@/lib/chatgptAndGoogleAi";
import NodeCache from 'node-cache';
import { prisma } from "@/lib/db";
import { getTranscriptForVideo } from "@/app/actions/youtubeTranscript";

const summaryCache = new NodeCache({ stdTTL: 3600 }); // Cache summaries for 1 hour
const queue = new PQueue({ concurrency: 1 });

const bodyParser = z.object({
  chapterId: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chapterId } = bodyParser.parse(body);

    const chapter = await prisma.chapter.findUnique({ 
      where: { id: chapterId },
      select: { id: true, videoId: true, summary: true, summaryStatus: true }
    });

    if (!chapter) {
      return NextResponse.json({ success: false, error: "Chapter not found" }, { status: 404 });
    }

    if (chapter.summary) {
      return NextResponse.json({ success: true, data: chapter.summary });
    }

    if (chapter.summaryStatus === 'processing') {
      return NextResponse.json({ success: true, message: "Summary generation in progress" });
    }

    if (!chapter.videoId) {
      await updateChapterSummaryStatus(chapterId, 'no_summary_available');
      return NextResponse.json({ success: false, message: "No video ID available for summary generation" });
    }

    // Check cache first
    const cachedSummary = summaryCache.get<string>(chapter.videoId);
    if (cachedSummary) {
      await updateChapterSummary(chapterId, cachedSummary);
      return NextResponse.json({ success: true, data: cachedSummary });
    }

    // Set status to processing before queuing
    await updateChapterSummaryStatus(chapterId, 'processing');

    queue.add(async () => {
      try {
        const summary = await fetchAndGenerateSummary(chapter.videoId!);
        if (summary) {
          summaryCache.set(chapter.videoId!, summary);
          await updateChapterSummary(chapterId, summary);
        } else {
          await updateChapterSummaryStatus(chapterId, 'no_summary_available');
        }
      } catch (error) {
        console.warn(`Error processing summary for chapter ${chapterId}:`, error);
        await updateChapterSummaryStatus(chapterId, 'error');
      }
    });

    return NextResponse.json({ success: true, message: "Summary generation task queued." });
  } catch (error) {
    console.warn(`Error processing summary:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function fetchAndGenerateSummary(videoId: string): Promise<string | null> {
  const transcriptResponse = await getTranscriptForVideo(videoId);

  if (transcriptResponse.status !== 200 || !transcriptResponse.transcript) {
    console.log(`No valid transcript for video ID ${videoId}.`);
    return null;
  }

  try {
    return await generateSummaryWithChunking(transcriptResponse.transcript);
  } catch (error) {
    console.warn(`Error generating summary for video ID ${videoId}:`, error);
    return null;
  }
}

async function generateSummaryWithChunking(transcript: string): Promise<string> {
  const chunkSize = 4000; // Reduced chunk size to lower token usage
  const chunks = transcript.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];

  const summaries = await Promise.all(chunks.map(chunk => generateVideoSummary(chunk)));
  const combinedSummary = summaries.join(' ');

  if (combinedSummary.length > chunkSize) {
    return generateSummaryWithChunking(combinedSummary);
  }

  return combinedSummary;
}

async function updateChapterSummary(chapterId: number, summary: string) {
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { summary, summaryStatus: 'completed' },
  });
}

async function updateChapterSummaryStatus(chapterId: number, status: 'processing' | 'completed' | 'error' | 'no_summary_available') {
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { summaryStatus: status },
  });
}

