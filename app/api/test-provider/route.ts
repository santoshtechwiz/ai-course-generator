import { AIProviderFactory } from '@/lib/ai/provider-factory'
import { NextResponse } from 'next/server'

/**
 * Test API Route for AI Providers
 * 
 * Usage:
 *   GET /api/test-provider?provider=openai
 *   GET /api/test-provider?provider=google
 *   GET /api/test-provider?provider=anthropic
 * 
 * Optional params:
 *   - test=chat (default) - Tests chat completion
 *   - test=quiz - Tests MCQ generation
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerType = searchParams.get('provider') || 'openai'
  const testType = searchParams.get('test') || 'chat'

  console.log(`\n🧪 Testing ${providerType} provider - ${testType} mode`)

  try {
    // Validate provider type
    if (!['openai', 'google', 'anthropic'].includes(providerType)) {
      return NextResponse.json({
        success: false,
        error: `Invalid provider: ${providerType}. Use 'openai', 'google', or 'anthropic'`
      }, { status: 400 })
    }

    // Create provider
    console.log('Creating provider...')
    const provider = AIProviderFactory.createProvider(providerType as any)
    console.log('✅ Provider created')

    const startTime = Date.now()

    if (testType === 'quiz') {
      // Test quiz generation
      console.log('Generating MCQ quiz...')
      const questions = await provider.generateMCQQuiz({
        title: 'JavaScript Arrays',
        amount: 3,
        difficulty: 'easy',
      })

      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        provider: providerType,
        testType: 'quiz',
        duration,
        result: {
          questionCount: questions.length,
          questions: questions,
        }
      })
    } else {
      // Test chat completion (default)
      console.log('Generating chat completion...')
      const result = await provider.generateChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Write a creative haiku about artificial intelligence.' }
        ],
        temperature: 0.7,
        maxTokens: 100,
      })

      const duration = Date.now() - startTime

      if (!result.content) {
        throw new Error('No content generated')
      }

      console.log('✅ Chat completion successful')

      return NextResponse.json({
        success: true,
        provider: providerType,
        testType: 'chat',
        duration,
        result: {
          content: result.content,
          usage: result.usage || null,
        }
      })
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    
    return NextResponse.json({
      success: false,
      provider: providerType,
      error: error.message,
      details: error.response?.data || null
    }, { status: 500 })
  }
}
