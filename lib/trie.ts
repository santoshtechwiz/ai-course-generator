export class TrieNode {
    children: { [key: string]: TrieNode } = {};
    courseIds: Set<number> = new Set();
  }
  
  export class Trie {
    root: TrieNode = new TrieNode();
  
    insert(word: string, courseId: number): void {
      for (let i = 0; i < word.length; i++) {
        let node = this.root;
        for (let j = i; j < word.length; j++) {
          const char = word[j].toLowerCase();
          if (!node.children[char]) {
            node.children[char] = new TrieNode();
          }
          node = node.children[char];
          node.courseIds.add(courseId);
        }
      }
    }
  
    search(query: string): number[] {
      let node = this.root;
      for (const char of query.toLowerCase()) {
        if (!node.children[char]) return [];
        node = node.children[char];
      }
      return Array.from(node.courseIds);
    }
  }
  
  