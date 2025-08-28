"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { handleNavigation } from "@/store/slices/quiz/quiz-slice";

/**
 * QuizStateManager - A component that manages quiz state across page transitions
 * 
 * This component will:
 * 1. Handle navigation between quiz pages properly
 * 2. Cancel pending requests when navigating away
 * 3. Preserve quiz data when navigating between related quiz pages
 */
export function QuizStateManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const prevPathname = useRef(pathname);
  
  useEffect(() => {
    const currentPath = pathname || '';
    const previousPath = prevPathname.current || '';
    
    // Check if we're navigating between quiz pages
    const isOnQuizPage = currentPath.includes("/quiz");
    const wasOnQuizPage = previousPath.includes("/quiz");
    
    if (isOnQuizPage && wasOnQuizPage) {
      // Navigating between quiz pages - keep data but reset status
      dispatch(handleNavigation({ keepData: true }));
    } else if (wasOnQuizPage && !isOnQuizPage) {
      // Navigating away from quiz pages - clear everything
      dispatch(handleNavigation({ keepData: false }));
    } else if (!wasOnQuizPage && isOnQuizPage) {
      // Navigating to quiz pages - reset for fresh start
      dispatch(handleNavigation({ keepData: false }));
    }
    
    prevPathname.current = currentPath;
  }, [dispatch, pathname]);
  
  return <>{children}</>;
}
