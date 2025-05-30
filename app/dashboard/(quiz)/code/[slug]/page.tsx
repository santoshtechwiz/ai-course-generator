"use client"

import { use } from "react"
import CodeQuizWrapper from "../components/CodeQuizWrapper"


export default function CodeQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slug = resolvedParams.slug;

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground">Quiz slug is missing. Please check the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6">
      <CodeQuizWrapper slug={slug} />
    </div>
  );
}
