/**
 * Script to check quiz ID 155 metadata structure
 * Run with: npx ts-node scripts/check-quiz-155.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkQuiz155() {
  console.log('🔍 Checking quiz ID 155...\n')

  const quiz = await prisma.userQuiz.findUnique({
    where: { id: 155 },
    select: {
      id: true,
      slug: true,
      title: true,
      quizType: true,
      metadata: true,
      questions: {
        select: {
          id: true,
          question: true,
          answer: true,
          options: true,
          questionType: true,
        },
      },
    },
  })

  if (!quiz) {
    console.log('❌ Quiz 155 not found')
    return
  }

  console.log('📊 Quiz Details:')
  console.log(`ID: ${quiz.id}`)
  console.log(`Slug: ${quiz.slug}`)
  console.log(`Title: ${quiz.title}`)
  console.log(`Type: ${quiz.quizType}`)
  console.log(`\n📝 Questions in UserQuizQuestion table: ${quiz.questions.length}`)
  
  if (quiz.questions.length > 0) {
    console.log('\nQuestions from database:')
    quiz.questions.forEach((q, i) => {
      console.log(`\n  Question ${i + 1} (ID: ${q.id}):`)
      console.log(`    Type: ${q.questionType}`)
      console.log(`    Question: ${q.question}`)
      console.log(`    Answer: ${q.answer}`)
      console.log(`    Options: ${JSON.stringify(q.options, null, 2)}`)
    })
  }

  console.log('\n📦 Metadata:')
  console.log(JSON.stringify(quiz.metadata, null, 2))
}

checkQuiz155()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
