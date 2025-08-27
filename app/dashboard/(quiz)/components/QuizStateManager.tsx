"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { resetQuiz } from "@/store/slices/quiz/quiz-slice";

/**
 * QuizStateManager - A component that manages quiz state across page transitions
 * 
 * This component will:
 * 1. Reset quiz state when navigating away from quiz pages
 * 2. Handle cleanup when unmounting
 */
export function QuizStateManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Only reset on mount, not on other pathname changes
    return () => {
      if (!pathname?.includes("/quiz")) {
        dispatch(resetQuiz({}));
      }
    };
  }, [dispatch, pathname]);
  
  return <>{children}</>;
}
