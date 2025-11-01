/**
 * Chat Module Diagnostic Script
 * Run this to identify issues with your chat setup
 * 
 * Usage: npx ts-node scripts/chat-diagnostic.ts
 */

import { prisma } from '@/lib/db'
import { RAGService } from '@/app/aimodel/chat/ragService'
import { ChatService } from '@/app/aimodel/chat/ChatService'

interface DiagnosticResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

const results: DiagnosticResult[] = []

function addResult(result: DiagnosticResult) {
  results.push(result)
  const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠'
  console.log(`${icon} [${result.category}] ${result.test}: ${result.message}`)
  if (result.details) {
    console.log('  Details:', JSON.stringify(result.details, null, 2))
  }
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===')
  
  try {
    await prisma.$connect()
    addResult({
      category: 'Database',
      test: 'Connection',
      status: 'PASS',
      message: 'Successfully connected to database'
    })
  } catch (error) {
    addResult({
      category: 'Database',
      test: 'Connection',
      status: 'FAIL',
      message: 'Failed to connect to database',
      details: { error: String(error) }
    })
    return false
  }

  return true
}

async function testDatabaseSchema() {
  console.log('\n=== Testing Database Schema ===')
  
  try {
    // Check if required tables exist
    const coursesCount = await prisma.course.count()
    const quizzesCount = await prisma.userQuiz.count()
    const chatMessagesCount = await prisma.chatMessage.count()

    addResult({
      category: 'Database',
      test: 'Schema',
      status: 'PASS',
      message: 'All required tables exist',
      details: {
        courses: coursesCount,
        quizzes: quizzesCount,
        chatMessages: chatMessagesCount
      }
    })

    // Check for data
    if (coursesCount === 0) {
      addResult({
        category: 'Database',
        test: 'Data',
        status: 'WARN',
        message: 'No courses found in database'
      })
    }

    if (quizzesCount === 0) {
      addResult({
        category: 'Database',
        test: 'Data',
        status: 'WARN',
        message: 'No quizzes found in database'
      })
    }

  } catch (error) {
    addResult({
      category: 'Database',
      test: 'Schema',
      status: 'FAIL',
      message: 'Database schema validation failed',
      details: { error: String(error) }
    })
  }
}

async function testRAGService() {
  console.log('\n=== Testing RAG Service ===')
  
  try {
    const ragService = new RAGService()
    
    addResult({
      category: 'RAG',
      test: 'Initialization',
      status: 'PASS',
      message: 'RAG Service initialized successfully'
    })

    // Test query
    console.log('  Testing RAG query...')
    const startTime = Date.now()
    const response = await ragService.generateResponse(
      'diagnostic-test',
      'What is JavaScript?',
      { maxTokens: 100, temperature: 0.7 }
    )
    const responseTime = Date.now() - startTime

    if (!response) {
      addResult({
        category: 'RAG',
        test: 'Query',
        status: 'FAIL',
        message: 'RAG returned null response'
      })
      return false
    }

    if (!response.content || response.content.trim().length === 0) {
      addResult({
        category: 'RAG',
        test: 'Query',
        status: 'FAIL',
        message: 'RAG returned empty content'
      })
      return false
    }

    addResult({
      category: 'RAG',
      test: 'Query',
      status: 'PASS',
      message: 'RAG query successful',
      details: {
        responseTime: `${responseTime}ms`,
        contentLength: response.content.length,
        documentsRetrieved: response.context?.relevantDocuments?.length || 0,
        tokensUsed: response.tokensUsed
      }
    })

    // Check response time
    if (responseTime > 5000) {
      addResult({
        category: 'RAG',
        test: 'Performance',
        status: 'WARN',
        message: `Slow response time: ${responseTime}ms (expected < 5000ms)`
      })
    } else {
      addResult({
        category: 'RAG',
        test: 'Performance',
        status: 'PASS',
        message: `Good response time: ${responseTime}ms`
      })
    }

    // Check if documents were retrieved
    if (!response.context?.relevantDocuments || response.context.relevantDocuments.length === 0) {
      addResult({
        category: 'RAG',
        test: 'Document Retrieval',
        status: 'WARN',
        message: 'No documents retrieved from vector store - check if embeddings exist'
      })
    } else {
      addResult({
        category: 'RAG',
        test: 'Document Retrieval',
        status: 'PASS',
        message: `Retrieved ${response.context.relevantDocuments.length} documents`
      })
    }

    return true

  } catch (error) {
    addResult({
      category: 'RAG',
      test: 'Service',
      status: 'FAIL',
      message: 'RAG Service test failed',
      details: {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    })
    return false
  }
}

async function testChatService() {
  console.log('\n=== Testing Chat Service ===')
  
  try {
    const chatService = new ChatService()
    
    addResult({
      category: 'Chat',
      test: 'Initialization',
      status: 'PASS',
      message: 'Chat Service initialized successfully'
    })

    // Test different message types
    const testMessages = [
      { message: 'Show me Python courses', expectedIntent: 'navigate_course' },
      { message: 'What is React?', expectedIntent: 'explain_concept' },
      { message: 'Create a quiz', expectedIntent: 'create_quiz' }
    ]

    for (const test of testMessages) {
      console.log(`  Testing: "${test.message}"`)
      const startTime = Date.now()
      
      const response = await chatService.processMessage(
        'diagnostic-test',
        test.message,
        { userId: 'test', isSubscribed: false }
      )
      const responseTime = Date.now() - startTime

      if (!response || !response.content) {
        addResult({
          category: 'Chat',
          test: `Message: "${test.message}"`,
          status: 'FAIL',
          message: 'No response generated',
          details: { response }
        })
        continue
      }

      addResult({
        category: 'Chat',
        test: `Message: "${test.message}"`,
        status: 'PASS',
        message: `Response generated (${responseTime}ms)`,
        details: {
          intent: response.intent,
          contentLength: response.content.length,
          actionsCount: response.actions?.length || 0,
          cached: response.cached
        }
      })
    }

  } catch (error) {
    addResult({
      category: 'Chat',
      test: 'Service',
      status: 'FAIL',
      message: 'Chat Service test failed',
      details: { error: String(error) }
    })
  }
}

async function testEnvironmentVariables() {
  console.log('\n=== Testing Environment Variables ===')
  
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
  ]

  const optionalVars = [
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'UPSTASH_REDIS_URL',
  ]

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult({
        category: 'Environment',
        test: varName,
        status: 'PASS',
        message: 'Variable is set'
      })
    } else {
      addResult({
        category: 'Environment',
        test: varName,
        status: 'FAIL',
        message: 'Required variable is missing'
      })
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult({
        category: 'Environment',
        test: varName,
        status: 'PASS',
        message: 'Optional variable is set'
      })
    } else {
      addResult({
        category: 'Environment',
        test: varName,
        status: 'WARN',
        message: 'Optional variable not set'
      })
    }
  }
}

async function testAPIEndpoint() {
  console.log('\n=== Testing API Endpoint ===')
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    console.log(`  Testing POST ${baseUrl}/api/chat`)
    const startTime = Date.now()
    
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test message' })
    })
    
    const responseTime = Date.now() - startTime
    const data = await response.json()

    if (!response.ok) {
      addResult({
        category: 'API',
        test: 'Endpoint',
        status: 'FAIL',
        message: `API returned ${response.status}`,
        details: { data, responseTime: `${responseTime}ms` }
      })
      return
    }

    if (!data.content) {
      addResult({
        category: 'API',
        test: 'Response',
        status: 'FAIL',
        message: 'API response missing content',
        details: { data }
      })
      return
    }

    addResult({
      category: 'API',
      test: 'Endpoint',
      status: 'PASS',
      message: `API responding correctly (${responseTime}ms)`,
      details: {
        contentLength: data.content.length,
        hasActions: !!data.actions,
        cached: data.cached
      }
    })

    if (responseTime > 5000) {
      addResult({
        category: 'API',
        test: 'Performance',
        status: 'WARN',
        message: `Slow API response: ${responseTime}ms`
      })
    }

  } catch (error) {
    addResult({
      category: 'API',
      test: 'Endpoint',
      status: 'FAIL',
      message: 'Failed to reach API endpoint',
      details: { 
        error: String(error),
        note: 'Make sure your dev server is running'
      }
    })
  }
}

function generateReport() {
  console.log('\n\n' + '='.repeat(60))
  console.log('DIAGNOSTIC REPORT')
  console.log('='.repeat(60))

  const categories = [...new Set(results.map(r => r.category))]
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category)
    const passed = categoryResults.filter(r => r.status === 'PASS').length
    const failed = categoryResults.filter(r => r.status === 'FAIL').length
    const warned = categoryResults.filter(r => r.status === 'WARN').length

    console.log(`\n${category}:`)
    console.log(`  ✓ Passed: ${passed}`)
    console.log(`  ✗ Failed: ${failed}`)
    console.log(`  ⚠ Warnings: ${warned}`)
  }

  const totalFailed = results.filter(r => r.status === 'FAIL').length
  const totalWarnings = results.filter(r => r.status === 'WARN').length

  console.log('\n' + '='.repeat(60))
  if (totalFailed === 0 && totalWarnings === 0) {
    console.log('✓ ALL TESTS PASSED - Chat module is healthy!')
  } else if (totalFailed === 0) {
    console.log(`⚠ TESTS PASSED WITH ${totalWarnings} WARNING(S)`)
  } else {
    console.log(`✗ ${totalFailed} TEST(S) FAILED`)
  }
  console.log('='.repeat(60))

  // Recommendations
  if (totalFailed > 0 || totalWarnings > 0) {
    console.log('\nRECOMMENDATIONS:')
    
    const failedRAG = results.find(r => r.category === 'RAG' && r.status === 'FAIL')
    if (failedRAG) {
      console.log('  1. Check RAG Service configuration and vector store connection')
      console.log('  2. Verify embeddings exist in your vector database')
      console.log('  3. Run: npm run embed-documents (if available)')
    }

    const noDocuments = results.find(r => r.test === 'Document Retrieval' && r.status === 'WARN')
    if (noDocuments) {
      console.log('  1. Your vector store appears empty')
      console.log('  2. Run embedding generation script')
      console.log('  3. Check vector store connection settings')
    }

    const slowPerformance = results.find(r => r.test === 'Performance' && r.status === 'WARN')
    if (slowPerformance) {
      console.log('  1. Consider reducing retrieval limit (k parameter)')
      console.log('  2. Add database indexes')
      console.log('  3. Implement Redis caching')
    }

    const missingEnv = results.find(r => r.category === 'Environment' && r.status === 'FAIL')
    if (missingEnv) {
      console.log('  1. Create .env.local file with required variables')
      console.log('  2. Copy from .env.example if available')
    }
  }

  console.log('\n')
}

async function runDiagnostics() {
  console.log('🔍 Starting Chat Module Diagnostics...\n')

  await testEnvironmentVariables()
  
  const dbConnected = await testDatabaseConnection()
  if (dbConnected) {
    await testDatabaseSchema()
  }

  await testRAGService()
  await testChatService()
  await testAPIEndpoint()

  generateReport()

  // Cleanup
  await prisma.$disconnect()
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Fatal error during diagnostics:', error)
  process.exit(1)
})