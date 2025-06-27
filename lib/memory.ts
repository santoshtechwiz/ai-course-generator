
export const MemoryManager = {
    cache: new Map<string, any>(),

    set(key: string, value: any): void {
        this.cache.set(key, value);
    },

    get(key: string): any | undefined {
        return this.cache.get(key);
    },

    delete(key: string): boolean {
        return this.cache.delete(key);
    },

    clear(): void {
        this.cache.clear();
    },
};
