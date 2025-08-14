import { fetchRandomQuizzes } from "@/lib/db"
import { NextResponse } from "next/server"
import { createCacheManager } from "@/app/services/cache/cache-manager"

const cache = createCacheManager()
const CACHE_KEY = "api:random-quizzes:3"
const TTL_SECONDS = 60 // 1 minute

export async function GET(request: Request) {
  const cached = await cache.get<any>(CACHE_KEY)
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } })
  }

  const randomQuizes = await fetchRandomQuizzes(3)

  await cache.set(CACHE_KEY, randomQuizes, TTL_SECONDS)

  return NextResponse.json(randomQuizes, { headers: { "X-Cache": "MISS" } })
}
