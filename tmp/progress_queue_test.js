const { clientProgressService } = require('../services/enhanced-progress/client.js')

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function run() {
  console.log('Starting test')
  const userId = 'u1'
  const courseId = '40'
  const chapterId = '548'

  // Enqueue many small progress updates
  for (let i = 1; i <= 10; i++) {
    clientProgressService.enqueueProgress(userId, courseId, chapterId, 'chapter_progress', i * 10, 5, { eventId: i })
  }

  // Enqueue another chapter
  clientProgressService.enqueueProgress(userId, courseId, '549', 'chapter_progress', 20, 3, { eventId: 'a' })

  console.log('Queue size after enqueues:', clientProgressService.getQueueSize())

  // Wait for auto-flush interval plus a little
  await sleep(16000)

  console.log('Final queue size:', clientProgressService.getQueueSize())
}

run().catch(e => console.error(e))
