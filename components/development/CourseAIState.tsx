"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

export default function CourseAIState() {
  const [open, setOpen] = useState(false);

  // Select all major slices you want to debug
  const quiz = useSelector((state: RootState) => state.quiz);
  const user = useSelector((state: RootState) => state.user);
  const auth = useSelector((state: RootState) => state.auth);
  const subscription = useSelector((state: RootState) => state.subscription);
  const flashcard = useSelector((state: RootState) => state.flashcard);
  const textQuiz = useSelector((state: RootState) => state.textQuiz);

  // Add time tracking to see when states update
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Update timestamp when state changes
  useEffect(() => {
    setLastUpdated(Date.now());
  }, [quiz, flashcard, textQuiz]);

  // Extract navigation details
  const navigationDetails = useMemo(() => {
    const currentIndex = quiz?.currentQuestionIndex;
    const navHistory = quiz?.navigationHistory || [];
    const lastNav = navHistory[0];

    return {
      currentIndex,
      lastNavFrom: lastNav?.from,
      lastNavTo: lastNav?.to,
      lastNavTime: lastNav?.timestamp ? new Date(lastNav.timestamp).toLocaleTimeString() : "N/A",
    };
  }, [quiz]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        minWidth: 320,
        maxWidth: 480,
        fontSize: 13,
      }}
      className="bg-background border border-primary/30 rounded-lg shadow-lg"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 font-semibold text-primary bg-primary/10 w-full rounded-t-lg"
        style={{ cursor: "pointer" }}
        aria-label="Toggle CourseAIState panel"
      >
        <Bug className="w-4 h-4" />
        CourseAIState
        {open ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronUp className="w-4 h-4 ml-auto" />}
      </button>
      {open && (
        <div className="max-h-[60vh] overflow-y-auto p-3 bg-white dark:bg-black/90 rounded-b-lg">
          {/* Enhanced navigation debug info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 mb-2 p-2 rounded text-xs border border-blue-200">
            <p>
              <strong>Quiz Navigation Debug:</strong>{" "}
              {new Date(lastUpdated).toLocaleTimeString()}
            </p>
            <p>Current Question: {quiz?.currentQuestionIndex}</p>
            <p>Questions Count: {quiz?.questions?.length}</p>
            <p>Answers Count: {Object.keys(quiz?.answers || {}).length}</p>
            <p>
              Last Nav: {navigationDetails.lastNavFrom} → {navigationDetails.lastNavTo} (
              {navigationDetails.lastNavTime})
            </p>
          </div>

          <details open>
            <summary className="font-bold text-primary mb-1 cursor-pointer">quiz</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(quiz, null, 2)}</pre>
          </details>
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">user</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(user, null, 2)}</pre>
          </details>
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">auth</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(auth, null, 2)}</pre>
          </details>
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">subscription</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(subscription, null, 2)}</pre>
          </details>
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">flashcard</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(flashcard, null, 2)}</pre>
          </details>
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">textQuiz</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(textQuiz, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
