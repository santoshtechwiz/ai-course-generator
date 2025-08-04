import { FlashcardRepository } from "../repositories/flashcard.repository";
import { BaseQuizService } from "./base-quiz.service";

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
  async getCardsByQuizSlug(slug: string, userId?: string) {
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
