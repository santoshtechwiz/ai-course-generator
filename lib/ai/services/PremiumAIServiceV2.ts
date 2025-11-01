/**
 * PremiumAIServiceV2 - Next Generation Premium AI Service
 *
 * Uses unified context and infrastructure for PREMIUM and ENTERPRISE tier users.
 * Provides advanced AI capabilities with higher quality models and limits.
 */

import { AIRequestContext } from '../types/context'
import { AIServiceV2 } from './AIServiceV2'
import { AIServiceResult } from './AIBaseService'
import type { AIModelName } from '@/config/ai.config'
import { AIProvider } from '../interfaces'
import { buildMCQPromptWithSchema } from '../prompts/mcq.prompt'
import { buildFlashcardPromptWithSchema } from '../prompts/flashcard.prompt'
import { buildOrderingPromptWithSchema } from '../prompts/ordering.prompt'
import { buildBlanksPromptWithSchema } from '../prompts/blanks.prompt'
import { buildOpenEndedPromptWithSchema } from '../prompts/openended.prompt'
import { buildCodeQuizPromptWithSchema } from '../prompts/code.prompt'
import { buildVideoQuizPromptWithSchema } from '../prompts/video.prompt'
import { buildCoursePromptWithSchema } from '../prompts/course.prompt'
import { FunctionCallParser, ResponseBuilder, ChatCompletionHelper, AILogger, ErrorHandler } from '../utils/service-helpers'
import { getModelConfig } from '@/config/ai.config'
import { PLAN_CONFIGURATIONS } from '@/types/subscription-plans'

export class PremiumAIServiceV2 extends AIServiceV2 {
  private logger: AILogger

  constructor(context: AIRequestContext) {
    super(context)
    this.logger = new AILogger('PremiumAIServiceV2')
  }

  /**
   * Determine if the user has a subscribed plan (PREMIUM or ENTERPRISE)
   */
  private isUserSubscribed(): boolean {
    return this.context.subscription.tier === 'premium' || this.context.subscription.tier === 'enterprise'
  }

  /**
   * Get credit cost for an operation based on subscription plan
   */
  private getCreditCost(operation: string): number {
    const planConfig = PLAN_CONFIGURATIONS[this.context.subscription.plan]
    return planConfig.creditCosts[operation as keyof typeof planConfig.creditCosts] ?? 0
  }

  // ============= Quiz Generation Methods =============

  /**
   * Generate Multiple Choice Questions (Premium quality)
   */
  async generateMultipleChoiceQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-mcq',
      params,
      this.getCreditCost('quiz-mcq')
    )
  }

  /**
   * Generate Fill-in-the-Blanks Quiz (Premium quality)
   */
  async generateFillInTheBlanksQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-blanks',
      params,
      this.getCreditCost('quiz-blanks')
    )
  }

  /**
   * Generate Open-Ended Questions (Premium only)
   */
  async generateOpenEndedQuestionsQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-openended',
      params,
      this.getCreditCost('quiz-openended')
    )
  }

  /**
   * Generate Code Quiz (Premium only)
   */
  async generateCodeQuiz(params: {
    topic: string
    language: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-code',
      params,
      this.getCreditCost('quiz-code')
    )
  }

  /**
   * Generate Flashcards (Premium quality)
   */
  async generateFlashcards(params: {
    topic: string
    count?: number
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-flashcard',
      params,
      this.getCreditCost('quiz-flashcard')
    )
  }

  /**
   * Generate Ordering Quiz (Premium quality)
   */
  async generateOrderingQuiz(params: {
    topic: string
    difficulty?: 'easy' | 'medium' | 'hard'
    numberOfQuestions?: number
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'quiz-ordering',
      params,
      this.getCreditCost('quiz-ordering')
    )
  }

  /**
   * Generate Video Quiz (Premium feature)
   */
  async generateVideoQuiz(params: {
    transcript: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'generateVideoQuiz',
      params,
      this.getCreditCost('quiz-video')
    )
  }

  /**
   * Generate Course Content (Premium feature)
   */
  async generateCourse(params: {
    topic: string
    units: string[]
  }): Promise<AIServiceResult> {
    return this.executeWithContext(
      'generateCourse',
      params,
      this.getCreditCost('course-creation')
    )
  }

  // ============= Core Execution Logic =============

  /**
   * Execute AI operation using premium models and enhanced prompts
   */
  protected async executeOperation<T>(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult<T>> {
    const operation = this.inferOperationFromParams(params)

    try {
      switch (operation) {
        case 'generateMultipleChoiceQuiz':
          return await this.executeMCQGeneration(provider, params)

        case 'generateFillInTheBlanksQuiz':
          return await this.executeBlanksGeneration(provider, params)

        case 'generateOpenEndedQuestionsQuiz':
          return await this.executeOpenEndedGeneration(provider, params)

        case 'generateCodeQuiz':
          return await this.executeCodeGeneration(provider, params)

        case 'generateFlashcards':
          return await this.executeFlashcardGeneration(provider, params)

        case 'generateOrderingQuiz':
          return await this.executeOrderingGeneration(provider, params)

        case 'generateVideoQuiz':
          return await this.executeVideoGeneration(provider, params)

        case 'generateCourse':
          return await this.executeCourseGeneration(provider, params)

        default:
          return ResponseBuilder.error(`Unsupported operation: ${operation}`, 'UNSUPPORTED_OPERATION')
      }
    } catch (error) {
      return ErrorHandler.handleOperationError(
        operation,
        error,
        this.logger,
        {
          userId: this.context.userId,
          requestId: this.context.request.id
        }
      )
    }
  }

  /**
   * Get premium model for operation based on centralized configuration
   */
  protected getModelForOperation(operation: string): AIModelName {
    // Use central configuration for model selection
    const modelConfig = getModelConfig(this.context.subscription.plan)
    return modelConfig.primary
  }

  // ============= Premium Operation Implementations =============

  private async executeMCQGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildMCQPromptWithSchema({
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty || 'medium',
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateMultipleChoiceQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateMultipleChoiceQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'MCQ')

    return ResponseBuilder.success(responseData, 1, result.usage?.totalTokens)
  }

  private async executeOpenEndedGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildOpenEndedPromptWithSchema({
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty || 'medium',
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateOpenEndedQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateOpenEndedQuestionsQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'OpenEnded')

    return ResponseBuilder.success(responseData, 2, result.usage?.totalTokens)
  }

  private async executeCodeGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildCodeQuizPromptWithSchema({
      topic: params.topic,
      programmingLanguage: params.language,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty as 'easy' | 'medium' | 'hard',
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateCodeQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateCodeQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Code')

    return ResponseBuilder.success(responseData, 2, result.usage?.totalTokens)
  }

  private async executeVideoGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildVideoQuizPromptWithSchema({
      courseTitle: params.courseTitle || 'Video Content',
      transcript: params.transcript,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty || 'medium',
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateVideoQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateVideoQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Video')

    return ResponseBuilder.success(responseData, 2, result.usage?.totalTokens)
  }

  private async executeCourseGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildCoursePromptWithSchema({
      title: params.topic,
      units: params.units,
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateCourse')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateCourse'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Course')

    return ResponseBuilder.success(responseData, 5, result.usage?.totalTokens)
  }

  // ============= Shared Implementations (delegate to BasicAIServiceV2 logic) =============

  private async executeBlanksGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    // Use similar logic to BasicAIServiceV2 but with premium settings
    const { messages, functions, functionCall } = buildBlanksPromptWithSchema({
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty,
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateFillInTheBlanksQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateFillInTheBlanksQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Blanks')

    return ResponseBuilder.success(responseData, 1, result.usage?.totalTokens)
  }

  private async executeFlashcardGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildFlashcardPromptWithSchema({
      topic: params.topic,
      count: params.count || 10, // Premium gets more flashcards
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateFlashcards')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateFlashcards'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Flashcard')

    const flashcards = Array.isArray(responseData) ? responseData.map((card: any, index: number) => ({
      id: index + 1,
      question: card.question,
      answer: card.answer,
    })) : []

    return ResponseBuilder.success({ flashcards }, 1, result.usage?.totalTokens)
  }

  private async executeOrderingGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildOrderingPromptWithSchema({
      topic: params.topic,
      difficulty: params.difficulty || 'medium',
      numberOfSteps: 6, // Premium gets more complex ordering
      numberOfQuestions: params.numberOfQuestions || 5,
      isSubscribed: this.isUserSubscribed(), // Enable premium features
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getPremiumParams('generateOrderingQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateOrderingQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'PremiumAIServiceV2', 'Ordering')

    return ResponseBuilder.success({
      id: Date.now().toString(),
      title: `${params.topic} - Ordering Quiz`,
      questions: responseData.questions || []
    }, 1, result.usage?.totalTokens)
  }

  // ============= Helper Methods =============

  private inferOperationFromParams(params: any): string {
    // Check for premium-specific indicators first
    if (params.language) {
      return 'generateCodeQuiz'
    }

    if (params.transcript) {
      return 'generateVideoQuiz'
    }

    if (params.units) {
      return 'generateCourse'
    }

    // Fall back to basic inference
    if (params.numberOfQuestions && params.topic && !params.count) {
      // Could be MCQ, blanks, or open-ended
      // For premium, assume open-ended if no specific indicators
      return 'generateOpenEndedQuestionsQuiz'
    }

    if (params.count && params.topic) {
      return 'generateFlashcards'
    }

    if (params.steps || params.numberOfSteps) {
      return 'generateOrderingQuiz'
    }

    // Default fallback
    return 'generateMultipleChoiceQuiz'
  }
}