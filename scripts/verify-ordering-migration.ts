/**
 * Verify migration script - check OrderingQuiz tables
 * Run with: npx tsx scripts/verify-ordering-migration.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Verifying OrderingQuiz migration...\n')

  try {
    // Count quizzes
    const quizCount = await prisma.orderingQuiz.count()
    console.log(`📊 Total OrderingQuizzes: ${quizCount}`)

    // Get quiz details
    const quizzes = await prisma.orderingQuiz.findMany({
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    for (const quiz of quizzes) {
      console.log('\n' + '='.repeat(60))
      console.log(`📝 Quiz: "${quiz.title}"`)
      console.log(`   Slug: ${quiz.slug}`)
      console.log(`   Difficulty: ${quiz.difficulty}`)
      console.log(`   Questions: ${quiz.questions.length}`)
      console.log('   ' + '-'.repeat(56))

      quiz.questions.forEach((q, i) => {
        const steps = Array.isArray(q.steps) ? q.steps : []
        const correctOrder = Array.isArray(q.correctOrder) ? q.correctOrder : []
        
        console.log(`   ${i + 1}. ${q.title}`)
        console.log(`      Steps: ${steps.length}`)
        console.log(`      Correct Order: [${correctOrder.join(', ')}]`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Verification complete!\n')

  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
