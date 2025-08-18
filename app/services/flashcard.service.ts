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
  async getQuizBySlug(slug: string, userId: string) {
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      include: {
        flashCards: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      return null;
    }

    return {
      isPublic: quiz.isPublic,
      isFavorite: quiz.isFavorite,
      id: quiz.id,
      title: quiz.title,
      questions: this.formatQuestions(quiz.flashCards || []),
      flashCards: quiz.flashCards || [], // Include both for backward compatibility
      userId: quiz.userId,
      language: quiz.language,
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
   * Update flashcard difficulty
   */
  async updateCardDifficulty(cardId: number, userId: string, difficulty: string) {
    return this.flashcardRepository.updateCardDifficulty(cardId, userId, difficulty);
  }

  /**
   * Format questions for flashcards
   */
  protected formatQuestions(questions: any[]): any[] {
    return questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      difficulty: q.difficulty,
      saved: q.saved || false,
      type: 'flashcard',
    }));
  }
}

export const flashcardService = new FlashcardService();
