import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// Trie Node Definition
class TrieNode {
  children: { [key: string]: TrieNode } = {};
  ids: number[] = [];
}

// Trie Definition
class Trie {
  root = new TrieNode();

  insert(word: string, id: number) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.ids.push(id);
  }

  search(prefix: string): number[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return node.ids;
  }
}

// Initialize Trie for Courses
const courseTrie = new Trie();
let isTrieInitialized = false;

const initializeTrie = async () => {
  if (isTrieInitialized) return; // Prevent multiple initializations

  try {
    const courses = await prisma.course.findMany({
      select: { id: true, name: true },
    });

    courses.forEach((course) => {
      courseTrie.insert(course.name.toLowerCase(), course.id); // Normalize input
    });

    console.log('Trie initialized with courses data.');
    isTrieInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Trie:', error);
  }
};

// Ensure Trie is initialized before processing requests
const ensureTrieIsReady = async () => {
  if (!isTrieInitialized) {
    await initializeTrie();
  }
};

// GET handler
export async function GET(request: Request) {
  await ensureTrieIsReady();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    // Search for matching course IDs using the Trie
    const courseIds = courseTrie.search(query.toLowerCase()); // Normalize query
    const courses = courseIds.length
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
          },
        })
      : [];

    // Search games in the database
    const games = await prisma.userQuiz.findMany({
      where: {
        questions: {
          some: {
            OR: [
              { question: { contains: query, mode: 'insensitive' } },
              { answer: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
      },
      select: {
        id: true,
        topic: true,
      },
    });

    return NextResponse.json({ courses, games });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}
