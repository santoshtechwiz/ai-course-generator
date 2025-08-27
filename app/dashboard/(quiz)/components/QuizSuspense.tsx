"use client";

import { Suspense } from "react";
import { QuizLoadingSkeleton } from "./QuizLoadingSkeleton";

export function QuizSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<QuizLoadingSkeleton />}>
      {children}
    </Suspense>
  );
}
