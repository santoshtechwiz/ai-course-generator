/**
 * BasicAIServiceV2 - Next Generation Basic AI Service
 *
 * Uses unified context and infrastructure for FREE and BASIC tier users.
 * Provides cost-effective AI generation with appropriate limits.
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
import { buildVideoQuizPromptWithSchema } from '../prompts/video.prompt'
import { getModelConfig } from '@/config/ai.config'
import { FunctionCallParser, ResponseBuilder, ChatCompletionHelper, AILogger, ErrorHandler } from '../utils/service-helpers'
import { PLAN_CONFIGURATIONS } from '@/types/subscription-plans'

export class BasicAIServiceV2 extends AIServiceV2 {
  private logger: AILogger

  constructor(context: AIRequestContext) {
    super(context)
    this.logger = new AILogger('BasicAIServiceV2')
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
   * Generate Multiple Choice Questions
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
   * Generate Fill-in-the-Blanks Quiz
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
   * Generate Flashcards
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
   * Generate Ordering Quiz
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

  // ============= Core Execution Logic =============

  /**
   * Execute AI operation using appropriate provider and prompts
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

        case 'generateFlashcards':
          return await this.executeFlashcardGeneration(provider, params)

        case 'generateOrderingQuiz':
          return await this.executeOrderingGeneration(provider, params)

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
   * Get appropriate model for operation based on subscription tier
   */
  protected getModelForOperation(operation: string): AIModelName {
    // Use central configuration for model selection
    const modelConfig = getModelConfig(this.context.subscription.plan)
    return modelConfig.primary
  }

  // ============= Operation Implementations =============

  private async executeMCQGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildMCQPromptWithSchema({
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty || 'medium',
      isSubscribed: this.isUserSubscribed(),
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getBasicParams('generateMultipleChoiceQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateMultipleChoiceQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'BasicAIServiceV2', 'MCQ')

    return ResponseBuilder.success(responseData, 1, result.usage?.totalTokens)
  }

  private async executeBlanksGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildBlanksPromptWithSchema({
      topic: params.topic,
      numberOfQuestions: params.numberOfQuestions,
      difficulty: params.difficulty,
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getBasicParams('generateFillInTheBlanksQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateFillInTheBlanksQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const responseData = FunctionCallParser.parseResponse(result, 'BasicAIServiceV2', 'blanks')

    return ResponseBuilder.success(responseData, 1, result.usage?.totalTokens)
  }

  private async executeFlashcardGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildFlashcardPromptWithSchema({
      topic: params.topic,
      count: params.count || 5,
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getBasicParams('generateFlashcards')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateFlashcards'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const flashcards = FunctionCallParser.parseFlashcardResponse(result, 'BasicAIServiceV2')

    // Format flashcards consistently
    const formattedFlashcards = Array.isArray(flashcards) ? flashcards.map((card: any, index: number) => ({
      id: index + 1,
      question: card.question,
      answer: card.answer,
    })) : []

    return ResponseBuilder.success(
      { flashcards: formattedFlashcards },
      1,
      result.usage?.totalTokens
    )
  }

  private async executeOrderingGeneration(
    provider: AIProvider,
    params: any
  ): Promise<AIServiceResult> {
    const { messages, functions, functionCall } = buildOrderingPromptWithSchema({
      topic: params.topic,
      difficulty: params.difficulty || 'medium',
      numberOfSteps: 5,
      numberOfQuestions: params.numberOfQuestions || 3,
    })

    const { temperature, maxTokens } = ChatCompletionHelper.getBasicParams('generateOrderingQuiz')

    const result = await provider.generateChatCompletion({
      model: this.getModelForOperation('generateOrderingQuiz'),
      messages,
      functions,
      functionCall,
      temperature,
      maxTokens,
    })

    const quizData = FunctionCallParser.parseResponse(result, 'BasicAIServiceV2', 'ordering')

    return ResponseBuilder.success(
      {
        id: Date.now().toString(),
        title: `${params.topic} - Ordering Quiz`,
        questions: quizData.questions || []
      },
      1,
      result.usage?.totalTokens
    )
  }

  // ============= Helper Methods =============

  private inferOperationFromParams(params: any): string {
    // Infer operation from parameters
    if (params.numberOfQuestions && params.topic && !params.count) {
      // Has numberOfQuestions but no count - likely a quiz
      if (params.difficulty) {
        return 'generateMultipleChoiceQuiz' // Default assumption
      }
    }

    if (params.count && params.topic) {
      return 'generateFlashcards'
    }

    // Check for specific operation indicators
    if (params.steps || params.numberOfSteps) {
      return 'generateOrderingQuiz'
    }

    // Default fallback
    return 'generateMultipleChoiceQuiz'
  }
}