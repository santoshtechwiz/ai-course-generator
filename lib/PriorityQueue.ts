class PriorityQueue<T> {
    protected heap: { item: T; priority: number }[] = []

    enqueue(item: T, priority: number): void {
        this.heap.push({ item, priority })
        this.bubbleUp(this.heap.length - 1)
    }
    find(predicate: (item: T) => boolean): T | undefined {
        for (let i = 0; i < this.heap.length; i++) {
            if (predicate(this.heap[i].item)) {
                return this.heap[i].item
            }
        }
        return undefined
    }

    dequeue(): T | undefined {
        if (this.isEmpty()) return undefined
        if (this.heap.length === 1) return this.heap.pop()!.item

        const top = this.heap[0]
        this.heap[0] = this.heap.pop()!
        this.bubbleDown(0)
        return top.item
    }

    isEmpty(): boolean {
        return this.heap.length === 0
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2)
            if (this.heap[parentIndex].priority <= this.heap[index].priority) break
                ;[this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
            index = parentIndex
        }
    }

    private bubbleDown(index: number): void {
        while (true) {
            const leftChild = 2 * index + 1
            const rightChild = 2 * index + 2
            let smallest = index

            if (leftChild < this.heap.length && this.heap[leftChild].priority < this.heap[smallest].priority) {
                smallest = leftChild
            }
            if (rightChild < this.heap.length && this.heap[rightChild].priority < this.heap[smallest].priority) {
                smallest = rightChild
            }

            if (smallest === index) break
                ;[this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]]
            index = smallest
        }
    }

    public getHeap(): { item: T; priority: number }[] {
        return this.heap
    }

    public size(): number {
        return this.heap.length
    }
}

export default PriorityQueue

