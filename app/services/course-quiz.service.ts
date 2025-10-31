import { courseQuizRepository } from "@/app/repositories/course-quiz.repository";
import { getQuestionsFromTranscript } from "@/services/videoProcessor";
import YoutubeService from "@/services/youtubeService";
import { prisma } from "@/lib/db";
import NodeCache from "node-cache";

// Service-level cache for quiz operations
const serviceCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // 10 minutes
  useClones: false,
  deleteOnExpire: true,
});

// Cache for preprocessed transcripts
const preprocessedCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600,
  useClones: false,
  deleteOnExpire: true,
});

interface QuizRequestData {
  videoId: string;
  chapterId: number;
  chapterName: string;
  userId?: string;
  subscriptionPlan?: string;
  credits?: number;
}

/**
 * Service for handling course quiz business logic
 */
export class CourseQuizService {  /**
   * Get or generate quiz questions for a chapter
   */
  async getOrGenerateQuizQuestions(data: QuizRequestData) {
    const { videoId, chapterId, chapterName, userId, subscriptionPlan, credits } = data;

    // Validate input
    if (!videoId || !chapterId || !chapterName) {
      throw new Error("Invalid request: Missing required fields");
    }

    // Check if generation is already in progress or completed
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { videoStatus: true }
    });

    if (chapter?.videoStatus === 'PROCESSING') {
      throw new Error("Quiz generation already in progress for this chapter");
    }

    if (chapter?.videoStatus === 'COMPLETED') {
      // Double-check if questions exist
      const existingQuestions = await courseQuizRepository.getQuestionsByChapterId(chapterId);
      if (existingQuestions && existingQuestions.length > 0) {
        console.log("Questions already exist for chapter", chapterId);
        return existingQuestions;
      }
    }

    // Mark as processing to prevent concurrent generation
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { videoStatus: 'PROCESSING' }
    });

    try {
      const cacheKey = `questions_${chapterId}_${videoId}`;
      let questions = serviceCache.get<any[]>(cacheKey);

      if (!questions || questions.length === 0) {
        // First try to get existing questions from the database
        questions = await courseQuizRepository.getQuestionsByChapterId(chapterId) as any[];

        if (!questions || questions.length === 0) {
          // Ensure summary exists before generating quiz (optimizes token usage)
          const existingSummary = await courseQuizRepository.getChapterSummary(chapterId);
          if (!existingSummary) {
            console.log("Generating summary for quiz optimization");
            await this.generateChapterSummary(chapterId, videoId);
          }

          // Now get the content for quiz generation (will prefer summary)
          const transcriptOrSummary = await this.fetchTranscriptOrSummary(chapterId, videoId);

          if (transcriptOrSummary) {
            questions = await this.generateAndSaveQuestions(transcriptOrSummary, chapterId, chapterName, userId, subscriptionPlan, credits);
          } else {
            throw new Error("Failed to fetch transcript or summary");
          }
        }

        if (questions && questions.length > 0) {
          serviceCache.set(cacheKey, questions);
        }
      }

      // Mark as completed
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { videoStatus: 'COMPLETED' }
      });

      console.log("Questions:", questions);
      return questions || [];
    } catch (error) {
      // Reset status on failure
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { videoStatus: 'PENDING' }
      });
      throw error;
    }
  }

  /**
   * Fetch transcript or summary for quiz generation
   */
  private async fetchTranscriptOrSummary(chapterId: number, videoId: string): Promise<string | null> {
    try {
      // FIRST: Try to get existing summary (shorter, better for quiz generation)
      const summary = await courseQuizRepository.getChapterSummary(chapterId);
      if (summary) {
        console.log("Using saved summary for quiz generation");
        return summary;
      }

      // SECOND: Try saved transcript
      const savedTranscript = await courseQuizRepository.getChapterTranscript(chapterId);
      if (savedTranscript) {
        console.log("Using saved transcript");
        return savedTranscript;
      }

      // THIRD: Fetch and save transcript
      console.log("Fetching transcript for video:", videoId);
      const transcriptResult = await YoutubeService.getTranscript(videoId);

      if (!transcriptResult?.transcript || transcriptResult.transcript.length === 0) {
        console.error("Failed to fetch transcript");
        return null;
      }

      // SAVE TRANSCRIPT TO AVOID FUTURE FETCHES
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { transcript: transcriptResult.transcript }
      });

      return transcriptResult.transcript;
    } catch (error) {
      console.error("Error in fetchTranscriptOrSummary:", error);
      return null;
    }
  }

  /**
   * Generate and save questions using AI
   */
  private async generateAndSaveQuestions(
    transcriptOrSummary: string,
    chapterId: number,
    chapterName: string,
    userId?: string,
    subscriptionPlan?: string,
    credits?: number,
  ): Promise<any[]> {
    try {
      console.log("Generating questions for text");
      const questions = await getQuestionsFromTranscript(transcriptOrSummary, chapterName, userId, subscriptionPlan, credits);

      if (questions.length > 0) {
        console.log("Saving questions to database");
        await courseQuizRepository.saveQuestionsForChapter(questions, chapterId);
      }

      return questions;
    } catch (error) {
      console.error("Error generating questions:", error);
      return [];
    }
  }

  /**
   * Generate chapter summary lazily (when first accessed)
   */
  async generateChapterSummary(chapterId: number, videoId: string): Promise<string | null> {
    try {
      // Check if summary already exists
      const existingSummary = await courseQuizRepository.getChapterSummary(chapterId);
      if (existingSummary) {
        return existingSummary;
      }

      // Check if summary generation is already completed
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { summaryStatus: true }
      });

      if (chapter?.summaryStatus === 'COMPLETED') {
        return null; // Already processed but summary might be null
      }

      // Get transcript for summary generation
      let transcript = await courseQuizRepository.getChapterTranscript(chapterId);
      if (!transcript) {
        // Fetch transcript if not saved
        const transcriptResult = await YoutubeService.getTranscript(videoId);
        if (transcriptResult?.transcript && transcriptResult.transcript.length > 0) {
          transcript = transcriptResult.transcript;
          // Save transcript
          await prisma.chapter.update({
            where: { id: chapterId },
            data: { transcript }
          });
        }
      }

      if (!transcript) {
        console.error("No transcript available for summary generation");
        return null;
      }

      // Generate summary (assuming you have a summary generation function)
      console.log("Generating summary for chapter", chapterId);
      const summary = await this.generateSummaryFromTranscript(transcript);

      if (summary) {
        // Save summary
        await prisma.chapter.update({
          where: { id: chapterId },
          data: { 
            summary,
            summaryStatus: 'COMPLETED'
          }
        });
      }

      return summary;
    } catch (error) {
      console.error("Error generating chapter summary:", error);
      return null;
    }
  }

  /**
   * Generate summary from transcript (placeholder - implement based on your AI service)
   */
  private async generateSummaryFromTranscript(transcript: string): Promise<string | null> {
    // TODO: Implement summary generation using your AI service
    // This should be similar to how you generate quiz questions but for summarization
    // Return a shorter version of the transcript
    try {
      // For now, return a truncated version as placeholder
      const summary = transcript.length > 1000 ? transcript.substring(0, 1000) + "..." : transcript;
      return summary;
    } catch (error) {
      console.error("Error in summary generation:", error);
      return null;
    }
  }
}

export { CourseQuizService as CourseQuizServiceClass };
export const courseQuizService = new CourseQuizService();
