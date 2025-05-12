export default class Semaphore {
  private maxConcurrency: number
  private currentConcurrency: number
  private queue: (() => void)[]
  count = 0
  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency
    this.currentConcurrency = 0
    this.queue = []
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  public async acquire() {
    await this.delay(this.currentConcurrency >= this.maxConcurrency ? 20000 : 0)
    return new Promise<void>((resolve) => {
      if (this.currentConcurrency < this.maxConcurrency) {
        this.currentConcurrency++
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  public release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()
      if (resolve) resolve()
    } else {
      this.currentConcurrency--
    }
  }
}
