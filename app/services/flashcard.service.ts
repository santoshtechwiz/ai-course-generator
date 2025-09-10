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
    console.log("Fetching flashcard quiz by slug:", { slug, userId });

    // Fetch all flashcards with the given slug
    const quiz = await prisma.flashCard.findMany({
      where: { slug },
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
        // Only fields that exist on the model
      },
      orderBy: { id: "asc" },
    });

    if (!quiz || quiz.length === 0) {
      console.error("Quiz not found:", { slug });
      return null;
    }

    // Format questions for the response
    const formattedQuestions = this.formatQuestions(quiz);

    // Provide fallback values for required fields
    return {
      isPublic: false,
      isFavorite: false,
      id: quiz[0]?.id,
      title: quiz[0]?.slug || "Untitled",
      questions: formattedQuestions,
      userId: quiz[0]?.userId,
      language: null,
    };
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
