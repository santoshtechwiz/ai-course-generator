import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

// Trie Node Definition
class TrieNode {
  children: { [key: string]: TrieNode } = {}
  ids: number[] = []
}

// Trie Definition
class Trie {
  root = new TrieNode()

  insert(word: string, id: number) {
    let node = this.root
    for (const char of word?.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode()
      }
      node = node.children[char]
    }
    node.ids.push(id)
  }

  search(prefix: string): number[] {
    let node = this.root
    for (const char of prefix?.toLowerCase()) {
      if (!node.children[char]) return []
      node = node.children[char]
    }
    return node.ids
  }
}

// Initialize Trie for Courses
const courseTrie = new Trie()
let isTrieInitialized = false

const initializeTrie = async () => {
  if (isTrieInitialized) return // Prevent multiple initializations

  try {
    const courses = await prisma.course.findMany({
      select: { id: true, title: true },
    })

    courses.forEach((course) => {
      courseTrie.insert(course.title?.toLowerCase(), course.id)
    })

    isTrieInitialized = true
  } catch (error) {
    console.error("Failed to initialize Trie:", error)
  }
}

// Ensure Trie is initialized before processing requests
const ensureTrieIsReady = async () => {
  if (!isTrieInitialized) {
    await initializeTrie()
  }
}

// GET handler
export async function GET(request: Request) {
  await ensureTrieIsReady()

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ error: "Search query is required" }, { status: 400 })
  }

  try {
    // Search for matching courses using the Trie and additional fields
    const courseIds = courseTrie.search(query?.toLowerCase())
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { id: { in: courseIds } },
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        AND: [{ isPublic: true }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
      },
    })

    // Search games in the database (only in topic field)
    const games = await prisma.userQuiz.findMany({
      where: {
        OR: [{ title: { contains: query, mode: "insensitive" } }],
        AND: [{ isPublic: true }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
      },
    })

    // Process game results
    const processedGames = games.map((game) => ({
      id: game.id,
      title: game.title,
      slug: game.slug,
      quizType: game.quizType,
    }))

    return NextResponse.json({ courses, games: processedGames })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "An error occurred while searching" }, { status: 500 })
  }
}
