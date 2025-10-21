import prisma from "@/lib/db";
import { BaseRepository } from "./base.repository";

/**
 * Repository for handling flashcard operations
 */
export class FlashcardRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.flashCard);
  }

  /**
   * Save/Unsave a flashcard
   */
  async saveCard(cardId: number, userId: string, isSaved: boolean) {
    // First check if the flashcard belongs to the user
    const flashcard = await prisma.flashCard.findUnique({
      where: { id: cardId },
      select: { userId: true },
    });

    if (!flashcard) {
      throw new Error("Flashcard not found");
    }

    if (flashcard.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.flashCard.update({
      where: { id: cardId },
      data: { saved: isSaved },
    });
  }

  /**
   * Get saved flashcards for a user
   */
  async getSavedCards(userId: string) {
    return prisma.flashCard.findMany({
      where: {
        userId,
        saved: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  /**
   * Get flashcards by quiz slug
   */
  async getCardsByQuizSlug(slug: string, userId?: string) {
    console.log('Repository: fetching cards by slug:', { slug, userId });

    const quiz = await prisma.userQuiz.findFirst({
      where: { 
        slug,
        quizType: "flashcard"
      },
      include: {
        flashCards: {
          select: {
            id: true,
            question: true,
            answer: true,
            difficulty: true,
            saved: true,
            userId: true,
            createdAt: true
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      console.error('Repository: quiz not found:', { slug });
      throw new Error("Quiz not found");
    }

    // Check access permission for private quizzes
    if (!quiz.isPublic && quiz.userId !== userId) {
      console.error('Repository: unauthorized access attempt:', { slug, quizUserId: quiz.userId, requestUserId: userId });
      throw new Error("Unauthorized: This quiz is private");
    }

    console.log('Repository: found quiz:', { 
      id: quiz.id, 
      cardCount: quiz.flashCards.length,
      isPublic: quiz.isPublic
    });
    return quiz.flashCards;
  }

  /**
   * Toggle flashcard difficulty
   */
  async updateCardDifficulty(cardId: number, userId: string, difficulty: string) {
    const flashcard = await prisma.flashCard.findUnique({
      where: { id: cardId },
      select: { userId: true },
    });

    if (!flashcard) {
      throw new Error("Flashcard not found");
    }

    if (flashcard.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return prisma.flashCard.update({
      where: { id: cardId },
      data: { difficulty },
    });
  }
}

const flashcardRepository = new FlashcardRepository();
