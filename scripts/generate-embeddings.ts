#!/usr/bin/env ts-node
/**
 * scripts/generate-embeddings.ts
 *
 * Generate and persist embeddings for courses, chapters, flashcards, and quizzes
 * Uses app/aimodel/core/embedding-manager to handle pgvector or JSON storage.
 */
import { EmbeddingManager, EmbeddingDocument } from '@/app/aimodel/core/embedding-manager'
import { prisma } from '@/lib/db'

async function main() {
  const mgr = new EmbeddingManager()
  await mgr.initialize()

  console.log('Gathering content to embed...')

  const [courses, chapters, flashcards, userQuizzes] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true, slug: true, description: true }, where: { isPublic: true } }),
    prisma.chapter.findMany({ select: { id: true, unitId: true, title: true, summary: true }, where: {} , take: 1000}),
    prisma.flashCard.findMany({ select: { id: true, question: true, answer: true }, where: {} , take: 5000}),
    prisma.userQuiz.findMany({ select: { id: true, title: true, slug: true, description: true }, where: { isPublic: true }, take: 200 }),
  ])

  const documents: EmbeddingDocument[] = []

  for (const c of courses) {
    documents.push({
      content: `Course: ${c.title}\n\n${c.description || ''}`,
      metadata: { type: 'course', id: c.id, title: c.title, slug: c.slug }
    })
  }

  for (const ch of chapters) {
    documents.push({
      content: `Chapter: ${ch.title}\n\n${ch.summary || ''}`,
      metadata: { type: 'chapter', id: ch.id, unitId: ch.unitId, title: ch.title }
    })
  }

  for (const f of flashcards) {
    documents.push({
      content: `FlashCard Q: ${f.question}\nA: ${f.answer}`,
      metadata: { type: 'flashcard', id: f.id }
    })
  }

  for (const q of userQuizzes) {
    documents.push({
      content: `Quiz: ${q.title}\n\n${q.description || ''}`,
      metadata: { type: 'quiz', id: q.id, title: q.title, slug: q.slug }
    })
  }

  console.log(`Prepared ${documents.length} documents for embedding`)

  const ids = await mgr.addDocuments(documents)
  console.log(`Inserted ${ids.length} embeddings`)
}

main().then(() => {
  console.log('Done')
  process.exit(0)
}).catch(err => {
  console.error('Error generating embeddings', err)
  process.exit(1)
})
