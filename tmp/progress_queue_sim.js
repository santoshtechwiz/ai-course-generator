class QueueSim {
  constructor() {
    this.queue = []
    this.maxQueueSize = 100
  }
  enqueue(ev) {
    const keyOf = (e) => `${e.userId}:${e.courseId}:${e.chapterId}:${e.eventType}`
    const incomingKey = keyOf(ev)
    const existingIndex = this.queue.findIndex(q => keyOf(q) === incomingKey)
    if (existingIndex >= 0) {
      const existing = this.queue[existingIndex]
      if (ev.eventType === 'chapter_progress') {
        existing.progress = Math.max(existing.progress || 0, ev.progress || 0)
        existing.timeSpent = (existing.timeSpent || 0) + (ev.timeSpent || 0)
        existing.timestamp = Math.max(existing.timestamp || 0, ev.timestamp || 0)
        existing.metadata = { ...(existing.metadata || {}), ...(ev.metadata || {}) }
        this.queue[existingIndex] = existing
        console.log(`Merged progress for ${ev.courseId}:${ev.chapterId} -> ${existing.progress}%`) 
      } else {
        this.queue[existingIndex] = ev
        console.log(`Replaced event ${ev.eventType} for ${ev.courseId}:${ev.chapterId}`)
      }
    } else {
      this.queue.push(ev)
      console.log(`Queued ${ev.eventType} for ${ev.courseId}:${ev.chapterId}`)
    }
  }
}

const sim = new QueueSim()
const userId = 'u1'
const courseId = '40'
const chapterId = '548'
for (let i=1;i<=10;i++) {
  sim.enqueue({ userId, courseId, chapterId, eventType: 'chapter_progress', progress: i*10, timeSpent: 5, timestamp: Date.now()+i, metadata: {i} })
}
sim.enqueue({ userId, courseId, chapterId: '549', eventType: 'chapter_progress', progress: 20, timeSpent: 3, timestamp: Date.now(), metadata: {a:1} })
console.log('Final queue:', sim.queue)
