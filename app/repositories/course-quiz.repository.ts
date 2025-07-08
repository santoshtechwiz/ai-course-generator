import { BaseRepository } from "./base.repository";
import prisma from "@/lib/db";
import NodeCache from "node-cache";

// Cache for quiz operations
const quizCache = new NodeCache({
  stdTTL: 3600, // 1 hour cache TTL
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false,
  maxKeys: 500,
});

/**
 * Repository for handling course quiz data operations
 */
export class CourseQuizRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.courseQuiz);
  }
  /**
   * Get questions for a specific chapter
   */
  async getQuestionsByChapterId(chapterId: number): Promise<any[]> {
    const cacheKey = `questions_chapter_${chapterId}`;
    const cachedQuestions = quizCache.get<any[]>(cacheKey);
    
    if (cachedQuestions) {
      return cachedQuestions;
    }

    const questions = await prisma.courseQuiz.findMany({
      where: { chapterId: chapterId },
    });

    const processedQuestions = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options as string),
    }));

    if (processedQuestions.length > 0) {
      quizCache.set(cacheKey, processedQuestions);
    }

    return processedQuestions;
  }

  /**
   * Get chapter summary for quiz generation
   */
  async getChapterSummary(chapterId: number) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { summary: true },
    });

    return chapter?.summary || null;
  }

  /**
   * Save questions for a chapter (batch operation)
   */
  async saveQuestionsForChapter(questions: any[], chapterId: number) {
    // Process questions in batches to avoid large transactions
    const batchSize = 10;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      await prisma.courseQuiz.createMany({
        data: batch.map((question: any) => {
          // Ensure options is an array before processing
          const questionOptions = Array.isArray(question.options)
            ? question.options
            : typeof question.options === "string"
            ? JSON.parse(question.options)
            : [];

          // For MultipleChoiceQuestion, the correct answer is not directly available.
          // Assume the first option is the correct answer, or adapt as needed.
          const answer = questionOptions[0] ?? "";

          // Make sure answer is included in options
          const uniqueOptions = questionOptions.includes(answer)
            ? questionOptions
            : [answer, ...questionOptions];

          const sortedOptions = uniqueOptions.sort(() => Math.random() - 0.5);

          return {
            question: question.question,
            answer: answer,
            options: JSON.stringify(sortedOptions),
            chapterId: chapterId,
          };
        }),
      });
    }

    // Clear cache for this chapter
    quizCache.del(`questions_chapter_${chapterId}`);
    
    return questions;
  }

  /**
   * Check if questions exist for a chapter
   */
  async hasQuestionsForChapter(chapterId: number): Promise<boolean> {
    const count = await prisma.courseQuiz.count({
      where: { chapterId },
    });
    
    return count > 0;
  }
}

export const courseQuizRepository = new CourseQuizRepository();
