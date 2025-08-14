import { QuizRepository } from "../repositories/quiz.repository";
import { UserRepository } from "../repositories/user.repository";
import NodeCache from "node-cache";

/**
 * Service for handling quiz listing and management operations
 */
export class QuizListService {
  private quizRepository: QuizRepository;
  private userRepository: UserRepository;
  private quizzesCache: NodeCache;

  constructor() {
    this.quizRepository = new QuizRepository();
    this.userRepository = new UserRepository();

    // Global singleton cache across HMR/serverless invocations
    const globalForQuizzes = globalThis as unknown as { __quizzesCache?: NodeCache };
    if (!globalForQuizzes.__quizzesCache) {
      globalForQuizzes.__quizzesCache = new NodeCache({
        stdTTL: 900, // 15 minutes
        checkperiod: 60, // Check for expired keys every minute
        useClones: false, // Disable cloning for better performance
      });
    }
    this.quizzesCache = globalForQuizzes.__quizzesCache;
  }

  /**
   * List all quizzes with optional filtering
   */
  async listQuizzes({
    limit = 10,
    quizType,
    search,
    userId,
    isPublic = true,
    includePrivate = false,
    favoritesOnly = false,
    useCache = true
  }: {
    limit?: number;
    quizType?: string;
    search?: string;
    userId?: string;
    isPublic?: boolean;
    includePrivate?: boolean;
    favoritesOnly?: boolean;
    useCache?: boolean;
  }) {
    // Create a cache key based on the parameters
    const cacheKey = `quizzes_${limit}_${quizType || "all"}_${search || ""}_${userId || ""}_${isPublic}_${includePrivate}_${favoritesOnly}`;
    
    // Check if we have a cached response
    if (useCache) {
      const cachedResponse = this.quizzesCache.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Get quizzes from repository
    const quizzes = await this.quizRepository.listQuizzes({
      limit,
      quizType,
      search,
      userId,
      isPublic,
      includePrivate,
      favoritesOnly
    });
    
    // Format the response
    const formattedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      quizType: quiz.quizType,
      isPublic: quiz.isPublic,
      timeStarted: quiz.timeStarted,
      slug: quiz.slug,
      questionCount: quiz._count.questions,
      isFavorite: quiz.isFavorite,
      difficulty: quiz.difficulty
    }));

    // Cache the response
    if (useCache) {
      this.quizzesCache.set(cacheKey, formattedQuizzes);
    }

    return formattedQuizzes;
  }

  /**
   * Get a random quiz
   */
  async getRandomQuiz(quizType?: string) {
    return this.quizRepository.getRandomQuiz(quizType);
  }

  /**
   * Check if user can create quizzes
   */
  async canCreateQuiz(userId: string): Promise<boolean> {
    // Check if user has an active subscription
    const hasSubscription = await this.userRepository.hasActiveSubscription(userId);
    
    if (hasSubscription) {
      return true;
    }
    
    // If no subscription, check if they have credits
    const user = await this.userRepository.findById(userId);
    return user && user.credits > 0;
  }
}
