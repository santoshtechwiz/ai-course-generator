import { FlashcardRepository } from "../repositories/flashcard.repository";
import { BaseQuizService } from "./base-quiz.service";
import prisma from "@/lib/db";

/**
 * Service for handling flashcard operations
 */
export class FlashcardService extends BaseQuizService {
  private flashcardRepository: FlashcardRepository;

  constructor() {
    super("flashcard");
    this.flashcardRepository = new FlashcardRepository();
  }

  /**
   * Override getQuizBySlug to handle flashcards properly
   */
  async getQuizBySlug(
    slug: string,
    userId: string
  ): Promise<{
    isPublic: boolean;
    isFavorite: boolean;
    id: number;
    title: string;
    questions: any[];
    userId: string;
    language: string | null;
  } | null> {
    try {
      console.log(`[FlashcardService] Fetching quiz: ${slug} for user: ${userId}`);

      // First find the UserQuiz record (don't filter by userId yet)
      const userQuiz = await prisma.userQuiz.findFirst({
        where: {
          slug,
          quizType: "flashcard"
        },
      });

      if (!userQuiz) {
        console.warn(`[FlashcardService] Quiz not found: ${slug}`);
        return null;
      }

      console.log(`[FlashcardService] Found UserQuiz:`, {
        id: userQuiz.id,
        slug: userQuiz.slug,
        title: userQuiz.title,
        isPublic: userQuiz.isPublic,
        ownerId: userQuiz.userId,
      });

      // Check if user has access (owner OR public quiz)
      const isOwner = userQuiz.userId === userId;
      const hasAccess = isOwner || userQuiz.isPublic;

      if (!hasAccess) {
        console.warn(`[FlashcardService] Private quiz access denied: ${slug} by user ${userId} (owner: ${userQuiz.userId})`);
        // Return special error object to indicate private quiz
        throw new Error("PRIVATE_QUIZ");
      }

      // Get flashcards by userQuizId (no userId filter - they belong to the quiz)
      // Also support legacy flashcards that only have slug (no userQuizId)
      console.log(`[FlashcardService] Querying flashcards with userQuizId: ${userQuiz.id} OR slug: ${slug}`);
      const flashcards = await prisma.flashCard.findMany({
        where: {
          OR: [
            { userQuizId: userQuiz.id },
            { slug: slug, userQuizId: null }  // Legacy flashcards without userQuizId
          ]
        },
        select: {
          id: true,
          question: true,
          answer: true,
          difficulty: true,
          saved: true,
          createdAt: true,
          userId: true,
          slug: true,
          updatedAt: true,
          generatedBy: true,
          version: true,
          parentId: true,
          userQuizId: true,
        },
        orderBy: { id: "asc" },
      });

      console.log(`[FlashcardService] Retrieved ${flashcards.length} flashcards for quiz ${userQuiz.id}`);
      
      if (flashcards.length > 0) {
        console.log(`[FlashcardService] First flashcard sample:`, {
          id: flashcards[0].id,
          question: flashcards[0].question?.substring(0, 50),
          answer: flashcards[0].answer?.substring(0, 50),
        });
      }

      // Format questions
      const formattedQuestions = this.formatQuestions(flashcards);
      
      console.log(`[FlashcardService] Formatted ${formattedQuestions.length} questions from ${flashcards.length} flashcards`);

      return {
        isPublic: userQuiz.isPublic,
        isFavorite: false,
        id: userQuiz.id,
        title: userQuiz.title,
        questions: formattedQuestions,
        userId: userQuiz.userId,
        language: userQuiz.language,
      };
    } catch (error) {
      // Re-throw PRIVATE_QUIZ errors for proper error handling
      if (error instanceof Error && error.message === "PRIVATE_QUIZ") {
        throw error;
      }
      console.error(`[FlashcardService] Error retrieving quiz ${slug} for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save/Unsave a flashcard
   */
  async saveCard(cardId: number, userId: string, isSaved: boolean) {
    return this.flashcardRepository.saveCard(cardId, userId, isSaved);
  }

  /**
   * Get saved flashcards for a user
   */
  async getSavedCards(userId: string) {
    return this.flashcardRepository.getSavedCards(userId);
  }

  /**
   * Get flashcards by quiz slug
   */
  async findBySlug(slug: string, userId?: string) {
    return this.flashcardRepository.getCardsByQuizSlug(slug, userId);
  }

  /**
   * Format questions for flashcards
   */
  protected formatQuestions(questions: any[]): any[] {
    // Log input for debugging
    if (!Array.isArray(questions)) {
      console.error("Invalid questions input:", questions);
      return [];
    }

    return questions
      .map((q: any) => {
        if (!q) {
          console.warn("Null/undefined question encountered");
          return null;
        }

        // Create formatted question with fallbacks
        const formatted = {
          id: q.id?.toString() || "",
          question: q.question || "",
          answer: q.answer || "",
          difficulty: q.difficulty || "medium",
          saved: !!q.saved,
          type: "flashcard",
          createdAt: q.createdAt || new Date(),
        };

        // Log any missing required fields
        if (!formatted.question || !formatted.answer) {
          console.warn("Question missing required fields:", {
            id: formatted.id,
            hasQuestion: !!formatted.question,
            hasAnswer: !!formatted.answer,
          });
        }

        return formatted;
      })
      .filter(Boolean); // Remove any null entries
  }
}

export const flashcardService = new FlashcardService();
