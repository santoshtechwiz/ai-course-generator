import { courseQuizRepository } from "@/app/repositories/course-quiz.repository";
import { getQuestionsFromTranscript } from "@/services/videoProcessor";
import YoutubeService from "@/services/youtubeService";
import { prisma } from "@/lib/db";
import NodeCache from "node-cache";

// ✅ PHASE 1 FIX: Unified cache with namespaced keys (reduced memory usage)
const quizCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // 10 minutes
  useClones: false,
  deleteOnExpire: true,
});

// Cache key prefixes for different data types
const CACHE_PREFIX = {
  SERVICE: 'service:',
  PREPROCESSED: 'preprocessed:',
} as const;

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

    // ✅ NEW: Check quizStatus to prevent redundant generation
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { videoStatus: true, quizStatus: true, quizGeneratedAt: true }
    });

    // If quiz already generated, return cached
    if (chapter?.quizStatus === 'COMPLETED') {
      const existingQuestions = await courseQuizRepository.getQuestionsByChapterId(chapterId);
      if (existingQuestions && existingQuestions.length > 0) {
        console.log(`[Quiz] Returning existing quiz for chapter ${chapterId} (generated at ${chapter.quizGeneratedAt})`);
        return existingQuestions;
      }
    }

    // If quiz generation failed recently, skip retry for 5 minutes
    if (chapter?.quizStatus === 'FAILED' && chapter.quizGeneratedAt) {
      const timeSinceAttempt = Date.now() - chapter.quizGeneratedAt.getTime();
      const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
      if (timeSinceAttempt < RETRY_DELAY) {
        console.warn(
          `[Quiz] Quiz generation failed for chapter ${chapterId}. Retry in ${Math.ceil((RETRY_DELAY - timeSinceAttempt) / 1000)}s`
        );
        throw new Error("Quiz generation failed. Please try again in a few minutes.");
      }
    }

    if (chapter?.videoStatus === 'PROCESSING') {
      throw new Error("Quiz generation already in progress for this chapter");
    }

    // ✅ NEW: Mark as generating (atomic operation)
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { quizStatus: 'GENERATING', videoStatus: 'PROCESSING' }
    });

    try {
      const cacheKey = `${CACHE_PREFIX.SERVICE}questions_${chapterId}_${videoId}`;
      let questions = quizCache.get<any[]>(cacheKey);

      if (!questions || questions.length === 0) {
        // First try to get existing questions from the database
        questions = await courseQuizRepository.getQuestionsByChapterId(chapterId) as any[];

        if (!questions || questions.length === 0) {
          // ✅ OPTIMIZATION: Check if summary exists FIRST (shorter, saves tokens)
          const existingSummary = await courseQuizRepository.getChapterSummary(chapterId);
          let contentForQuiz: string | null = existingSummary;
          let useSummary = false;

          // If no summary, fall back to transcript
          if (!contentForQuiz) {
            contentForQuiz = await this.fetchTranscriptOrSummary(chapterId, videoId);
            useSummary = false;
          } else {
            useSummary = true;
            console.log(`[Quiz] Found existing summary for chapter ${chapterId}, will use for quiz generation`);
          }

          if (contentForQuiz) {
            // ✅ OPTIMIZATION: Pass useSummary flag to reduce token usage
            questions = await this.generateAndSaveQuestions(
              contentForQuiz,
              chapterId,
              chapterName,
              userId,
              subscriptionPlan,
              credits,
              useSummary
            );
          } else {
            throw new Error("Failed to fetch transcript or summary");
          }
        }

        if (questions && questions.length > 0) {
          quizCache.set(cacheKey, questions);
        }
      }

      // ✅ NEW: Mark as completed with timestamp
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          quizStatus: 'COMPLETED',
          videoStatus: 'COMPLETED',
          quizGeneratedAt: new Date()
        }
      });

      console.log(`[Quiz] Successfully generated ${questions.length} questions for chapter ${chapterId}`);
      return questions || [];
    } catch (error) {
      // ✅ NEW: Mark as failed with timestamp for retry logic
      console.error(`[Quiz] Failed to generate quiz for chapter ${chapterId}:`, error);
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          quizStatus: 'FAILED',
          videoStatus: 'PENDING',
          quizGeneratedAt: new Date()
        }
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
    useSummary?: boolean,
  ): Promise<any[]> {
    try {
      const contentLabel = useSummary ? 'summary' : 'transcript';
      console.log(`[Quiz] Generating questions from ${contentLabel} for chapter ${chapterId}`);

      // ✅ OPTIMIZATION: Pass useSummary flag to reduce token usage
      const questions = await getQuestionsFromTranscript(
        transcriptOrSummary,
        chapterName,
        userId,
        subscriptionPlan,
        credits,
        useSummary
      );

      if (questions.length > 0) {
        console.log(`[Quiz] Saving ${questions.length} questions for chapter ${chapterId}`);
        await courseQuizRepository.saveQuestionsForChapter(questions, chapterId);
      }

      return questions;
    } catch (error) {
      console.error(`[Quiz] Error generating questions:`, error);
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
