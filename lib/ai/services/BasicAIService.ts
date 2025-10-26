/**
 * BasicAIService - AI Service for FREE and BASIC tier users
 * 
 * Uses efficient models (GPT-4o-mini, GPT-3.5-turbo) with appropriate limits
 * for cost-effective AI generation.
 */

import type { SubscriptionPlanType } from '@/types/subscription'
import { AIBaseService, type AIServiceContext, type AIServiceResult } from './AIBaseService'
import { buildMCQPromptWithSchema } from '@/lib/ai/prompts/mcq.prompt'
import { buildFlashcardPrompt, getFlashcardFunctionSchema } from '@/lib/ai/prompts/flashcard.prompt'
import { buildOrderingPromptWithSchema } from '@/lib/ai/prompts/ordering.prompt'
import { buildBlanksPromptWithSchema } from '@/lib/ai/prompts/blanks.prompt'
import { buildVideoQuizPromptWithSchema } from '@/lib/ai/prompts/video.prompt'
import { truncateTranscript, estimateTokenCount, buildSummaryPromptWithSchema } from '@/lib/ai/prompts/summary.prompt'
import { buildCoursePromptWithSchema } from '@/lib/ai/prompts/course.prompt'

export class BasicAIService extends AIBaseService {
  constructor(context: AIServiceContext) {
    super(context)
  }

  getSubscriptionPlan(): SubscriptionPlanType {
    return this.context.subscriptionPlan
  }

  getServiceName(): string {
    return 'BasicAIService'
  }

  // ============= Quiz Generation Methods =============

  /**
   * Generate Multiple Choice Questions
   * @alias generateMCQ (maintained for backward compatibility)
   */
  async generateMultipleChoiceQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      // 1. Validate feature access
      const accessCheck = await this.checkFeatureAccess('quiz-mcq')
      if (!accessCheck.success) return accessCheck

      // 2. Validate and sanitize inputs
      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        50,
        10
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const difficultyValidation = this.validateDifficulty(params.difficulty)
      if (!difficultyValidation.isValid) {
        return { success: false, error: difficultyValidation.error }
      }

      // 3. Check plan-specific limits
      const limitCheck = this.validatePlanLimits('quiz-mcq', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      // 4. Check credits
      const creditCost = this.getCreditCost('quiz-mcq')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      // 5. Check rate limits
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      // 6. Build request using prompt template with function calling
      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()
      
      const { messages, functions, functionCall } = buildMCQPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        difficulty: difficultyValidation.sanitizedInput!,
        isPremium: false,
      })
      
      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      // 7. Log usage
      await this.logUsage({
        featureType: 'quiz-mcq',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * @deprecated Use generateMultipleChoiceQuiz instead
   * @alias generateMultipleChoiceQuiz
   */
  async generateMCQ(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.generateMultipleChoiceQuiz(params)
  }

  /**
   * Generate Fill-in-the-Blanks Quiz
   * @alias generateBlanksQuiz (maintained for backward compatibility)
   */
  async generateFillInTheBlanksQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    try {
      // 1. Feature access check
      const accessCheck = await this.checkFeatureAccess('quiz-blanks')
      if (!accessCheck.success) return accessCheck

      // 2. Input validation
      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        30,
        10
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      // 3. Plan limits
      const limitCheck = this.validatePlanLimits('quiz-blanks', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      // 4. Credits
      const creditCost = this.getCreditCost('quiz-blanks')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      // 5. Generate using prompt template with function calling
      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()
      
      const { messages, functions, functionCall } = buildBlanksPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        difficulty: params.difficulty,
      })
      
      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      // 6. Log
      await this.logUsage({
        featureType: 'quiz-blanks',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * @deprecated Use generateFillInTheBlanksQuiz instead
   * @alias generateFillInTheBlanksQuiz
   */
  async generateBlanksQuiz(params: {
    topic: string
    numberOfQuestions: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<AIServiceResult> {
    return this.generateFillInTheBlanksQuiz(params)
  }

  /**
   * Generate Flashcards
   */
  async generateFlashcards(params: {
    topic: string
    count: number
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-flashcard')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const countValidation = this.validateNumberInput(params.count, 1, 100, 10)
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const creditCost = this.getCreditCost('quiz-flashcard')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const messages = buildFlashcardPrompt({
        topic: topicValidation.sanitizedInput!,
        count: countValidation.sanitizedInput!,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions: [getFlashcardFunctionSchema()],
        functionCall: { name: 'generate_flashcards' },
      })

      await this.logUsage({
        featureType: 'quiz-flashcard',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      return {
        success: true,
        data: result.functionCall 
          ? JSON.parse(result.functionCall.arguments).flashcards 
          : result.content,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Ordering Quiz
   */
  async generateOrderingQuiz(params: {
    topic: string
    difficulty?: 'easy' | 'medium' | 'hard'
    numberOfSteps?: number
    numberOfQuestions?: number
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-ordering')
      if (!accessCheck.success) return accessCheck

      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      const difficultyValidation = this.validateDifficulty(params.difficulty)
      if (!difficultyValidation.isValid) {
        return { success: false, error: difficultyValidation.error }
      }

      const stepsValidation = this.validateNumberInput(params.numberOfSteps || 5, 3, 8, 5)
      if (!stepsValidation.isValid) {
        return { success: false, error: stepsValidation.error }
      }

      const questionsValidation = this.validateNumberInput(params.numberOfQuestions || 3, 1, 10, 3)
      if (!questionsValidation.isValid) {
        return { success: false, error: questionsValidation.error }
      }

      // Check credits for ordering quiz
      const creditCost = this.getCreditCost('quiz-ordering')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildOrderingPromptWithSchema({
        topic: topicValidation.sanitizedInput!,
        difficulty: difficultyValidation.sanitizedInput!,
        numberOfSteps: stepsValidation.sanitizedInput!,
        numberOfQuestions: questionsValidation.sanitizedInput!,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      await this.logUsage({
        featureType: 'quiz-ordering',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          // Always return the full parsed object, not just steps
          responseData = parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Video Quiz
   * Creates quiz questions from video transcript
   */
  async generateVideoQuiz(params: {
    courseTitle: string
    transcript: string
    numberOfQuestions: number
    quizType?: 'mcq' | 'openended'
  }): Promise<AIServiceResult> {
    try {
      const accessCheck = await this.checkFeatureAccess('quiz-video')
      if (!accessCheck.success) return accessCheck

      const titleValidation = this.sanitizeTextInput(params.courseTitle, 200)
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error }
      }

      const transcriptValidation = this.sanitizeTextInput(params.transcript, 50000)
      if (!transcriptValidation.isValid) {
        return { success: false, error: transcriptValidation.error }
      }

      const countValidation = this.validateNumberInput(
        params.numberOfQuestions,
        1,
        20,
        5
      )
      if (!countValidation.isValid) {
        return { success: false, error: countValidation.error }
      }

      const limitCheck = this.validatePlanLimits('quiz-video', countValidation.sanitizedInput!)
      if (!limitCheck.success) return limitCheck

      const creditCost = this.getCreditCost('quiz-video')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildVideoQuizPromptWithSchema({
        courseTitle: titleValidation.sanitizedInput!,
        transcript: transcriptValidation.sanitizedInput!,
        numberOfQuestions: countValidation.sanitizedInput!,
        quizType: params.quizType || 'mcq',
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens || 4096,
      })

      await this.logUsage({
        featureType: 'quiz-video',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed.questions || parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Summary
   * Creates a concise summary from transcript or text content
   */
  async generateSummary(params: {
    transcript: string
    summaryLength?: number
    maxTokens?: number
  }): Promise<AIServiceResult> {
    try {
      // Check authentication (summary generation should be authenticated)
      if (!this.context.isAuthenticated) {
        return {
          success: false,
          error: 'You must be logged in to generate summaries.',
          errorCode: 'AUTH_REQUIRED',
        }
      }

      const summaryLength = params.summaryLength || 250
      const maxTokens = params.maxTokens || 4000

      // Estimate token count and truncate if needed
      const estimatedTokens = estimateTokenCount(params.transcript)
      let transcript = params.transcript

      if (estimatedTokens > maxTokens) {
        console.log(`[BasicAIService] Transcript too long (${estimatedTokens} tokens), truncating to ${maxTokens}`)
        transcript = truncateTranscript(params.transcript, maxTokens)
      }

      const transcriptValidation = this.sanitizeTextInput(transcript, 50000)
      if (!transcriptValidation.isValid) {
        return { success: false, error: transcriptValidation.error }
      }

      // Summary generation typically costs 1 credit
      const creditCost = 1
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildSummaryPromptWithSchema({
        transcript: transcriptValidation.sanitizedInput!,
        summaryLength,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: 0.7,
        maxTokens: Math.min(summaryLength * 2, 1000), // Allow 2x words for tokens
      })

      await this.logUsage({
        featureType: 'summary-generation',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      return {
        success: true,
        data: result.functionCall 
          ? JSON.parse(result.functionCall.arguments).summary
          : result.content,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Generate Course Content
   * Creates a structured course outline with units and chapters with YouTube search queries
   */
  async generateCourseContent(params: {
    topic: string
    units: string[]
  }): Promise<AIServiceResult> {
    try {
      // 1. Validate feature access
      const accessCheck = await this.checkFeatureAccess('course-creation')
      if (!accessCheck.success) return accessCheck

      // 2. Validate and sanitize inputs
      const topicValidation = this.sanitizeTextInput(params.topic, 200)
      if (!topicValidation.isValid) {
        return { success: false, error: topicValidation.error }
      }

      if (!params.units || !Array.isArray(params.units) || params.units.length === 0) {
        return { success: false, error: 'Units array is required and cannot be empty' }
      }

      if (params.units.length > 3) {
        return { success: false, error: 'Maximum 3 units allowed' }
      }

      // Validate each unit
      for (const unit of params.units) {
        const unitValidation = this.sanitizeTextInput(unit, 100)
        if (!unitValidation.isValid) {
          return { success: false, error: `Invalid unit name: ${unitValidation.error}` }
        }
      }

      // 3. Check plan-specific limits
      const limitCheck = this.validatePlanLimits('course-creation', params.units.length)
      if (!limitCheck.success) return limitCheck

      // 4. Check credits
      const creditCost = this.getCreditCost('course-creation')
      const creditCheck = this.checkCredits(creditCost)
      if (!creditCheck.success) return creditCheck

      // 5. Check rate limits
      const rateLimitCheck = await this.checkRateLimit()
      if (!rateLimitCheck.success) return rateLimitCheck

      // 6. Build request using prompt template with function calling
      const options = this.buildRequestOptions()
      const model = this.getPrimaryModel()

      const { messages, functions, functionCall } = buildCoursePromptWithSchema({
        title: topicValidation.sanitizedInput!,
        units: params.units,
      })

      const result = await this.provider.generateChatCompletion({
        model,
        messages,
        functions,
        functionCall,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      })

      // 7. Log usage
      await this.logUsage({
        featureType: 'course-creation',
        creditsUsed: creditCost,
        tokensUsed: result.usage?.totalTokens,
        success: true,
      })

      // Parse function call response or use content
      let responseData = result.content
      if (result.functionCall?.arguments) {
        try {
          const parsed = JSON.parse(result.functionCall.arguments)
          responseData = parsed
        } catch (e) {
          console.error('Failed to parse function call arguments:', e)
        }
      }

      return {
        success: true,
        data: responseData,
        usage: {
          creditsUsed: creditCost,
          tokensUsed: result.usage?.totalTokens,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export default BasicAIService
