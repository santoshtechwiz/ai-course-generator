import { courseQuizRepository } from "@/app/repositories/course-quiz.repository";
import { getQuestionsFromTranscript } from "@/services/videoProcessor";
import YoutubeService from "@/services/youtubeService";
import NodeCache from "node-cache";

// Service-level cache for quiz operations
const serviceCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // 10 minutes
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

    const cacheKey = `questions_${chapterId}_${videoId}`;
    let questions = serviceCache.get<any[]>(cacheKey);

    if (!questions || questions.length === 0) {
      // First try to get existing questions from the database
      questions = await courseQuizRepository.getQuestionsByChapterId(chapterId) as any[];

      if (!questions || questions.length === 0) {
        // If no questions in database, generate new ones
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
    console.log("Questions:", questions);
    return questions || [];
  }

  /**
   * Fetch transcript or summary for quiz generation
   */
  private async fetchTranscriptOrSummary(chapterId: number, videoId: string): Promise<string | null> {
    try {
      // First, check if a summary exists for the chapter
      const summary = await courseQuizRepository.getChapterSummary(chapterId);

      if (summary) {
        return summary;
      }

      // If no summary exists, fetch the transcript
      console.log("Fetching transcript for video:", videoId);
      const transcriptResult = await YoutubeService.getTranscript(videoId);

      if (!transcriptResult?.transcript || transcriptResult.transcript.length === 0) {
        console.error("Failed to fetch transcript");
        return null;
      }

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
   * Check if quiz questions exist for a chapter
   */
  async hasQuestionsForChapter(chapterId: number): Promise<boolean> {
    return courseQuizRepository.hasQuestionsForChapter(chapterId);
  }
}

export const courseQuizService = new CourseQuizService();
