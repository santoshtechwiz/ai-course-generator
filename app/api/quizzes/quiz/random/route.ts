import { fetchRandomQuizzes } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const randomQuizes = await fetchRandomQuizzes(3)

  return NextResponse.json(randomQuizes)
}
