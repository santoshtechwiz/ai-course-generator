/**
 * Migration script to move ordering quiz data from UserQuiz metadata to OrderingQuiz tables
 * Run with: npx tsx scripts/migrate-ordering-quizzes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateOrderingQuizzes() {
  console.log('🔄 Starting migration of ordering quizzes...\n')

  try {
    // Find all ordering quizzes in UserQuiz with metadata
    const userQuizzes = await prisma.userQuiz.findMany({
      where: {
        quizType: 'ordering',
        metadata: { not: null },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        metadata: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
      },
    })

    console.log(`📊 Found ${userQuizzes.length} ordering quizzes to migrate\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const userQuiz of userQuizzes) {
      try {
        // Check if already migrated
        const existing = await prisma.orderingQuiz.findUnique({
          where: { slug: userQuiz.slug },
        })

        if (existing) {
          console.log(`⏭️  Skipped: "${userQuiz.title}" (already migrated)`)
          skippedCount++
          continue
        }

        // Parse metadata
        let metadata: any = userQuiz.metadata
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata)
          } catch {
            console.error(`❌ Error: Failed to parse metadata for "${userQuiz.title}"`)
            errorCount++
            continue
          }
        }

        // Extract questions from metadata
        let questions: any[] = []

        if (Array.isArray(metadata)) {
          // Current format: array of question objects
          questions = metadata.filter((q: any) => q.type === 'ordering' && q.steps)
        } else if (metadata?.questions && Array.isArray(metadata.questions)) {
          // Alternative format: metadata.questions array
          questions = metadata.questions
        } else if (metadata?.steps && Array.isArray(metadata.steps)) {
          // Old format: single question at root
          questions = [{
            id: userQuiz.id,
            title: userQuiz.title,
            steps: metadata.steps,
            correctOrder: metadata.correctOrder || [],
            description: metadata.description || '',
          }]
        }

        if (questions.length === 0) {
          console.error(`❌ Error: No questions found for "${userQuiz.title}"`)
          errorCount++
          continue
        }

        // Create OrderingQuiz
        const orderingQuiz = await prisma.orderingQuiz.create({
          data: {
            slug: userQuiz.slug,
            title: userQuiz.title,
            description: userQuiz.description || null,
            topic: userQuiz.title,
            difficulty: userQuiz.difficulty || 'medium',
            isPublic: userQuiz.isPublic ?? true,
            createdBy: userQuiz.userId,
            createdAt: userQuiz.createdAt,
            updatedAt: userQuiz.updatedAt,
          },
        })

        // Create OrderingQuizQuestions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          
          // Ensure steps is an array
          let steps = q.steps || []
          if (!Array.isArray(steps)) {
            console.warn(`⚠️  Warning: Invalid steps for question "${q.title}", skipping`)
            continue
          }

          // Ensure correctOrder is an array
          let correctOrder = q.correctOrder || []
          if (!Array.isArray(correctOrder)) {
            // Try to parse if it's a string
            if (typeof correctOrder === 'string') {
              try {
                correctOrder = JSON.parse(correctOrder)
              } catch {
                correctOrder = []
              }
            }
          }

          await prisma.orderingQuizQuestion.create({
            data: {
              orderingQuizId: orderingQuiz.id,
              title: q.title || `Question ${i + 1}`,
              description: q.description || null,
              steps: steps,
              correctOrder: correctOrder,
              orderIndex: i + 1,
            },
          })
        }

        console.log(`✅ Migrated: "${userQuiz.title}" (${questions.length} questions)`)
        migratedCount++

      } catch (error) {
        console.error(`❌ Error migrating "${userQuiz.title}":`, error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${migratedCount}`)
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(60) + '\n')

    if (migratedCount > 0) {
      console.log('🎉 Migration completed successfully!')
      console.log('\n💡 Next steps:')
      console.log('   1. Refresh your browser')
      console.log('   2. Navigate to an ordering quiz')
      console.log('   3. Complete and submit the quiz')
      console.log('   4. Verify results display correctly\n')
    }

  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateOrderingQuizzes()
  .then(() => {
    console.log('✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
