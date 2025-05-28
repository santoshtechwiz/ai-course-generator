"use client"

import { use } from "react"
import McqQuizWrapper from "../components/McqQuizWrapper"

export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug

  return (
    <div className="container max-w-4xl py-6">
      <McqQuizWrapper slug={slug} />
    </div>
  )
}
