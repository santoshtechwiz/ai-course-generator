"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { useSession } from "next-auth/react";

export default function CourseAIState() {
  const [open, setOpen] = useState(false);  
    // Select all major slices you want to debug
  const quiz = useSelector((state: RootState) => state.quiz);
  const flashcard = useSelector((state: RootState) => state.flashcard);
  const course = useSelector((state: RootState) => state.course);
  
  // New session-based auth
  const { user: authUser, plan, credits, isAuthenticated, isLoading } = useAuth();
  const { data: session, status } = useSession();
  
  // Add time tracking to see when states update
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);

  // Update timestamp when state changes
  useEffect(() => {
    setLastUpdated(Date.now());
  }, [quiz, flashcard, course]);
  // Extract navigation details
  const navigationDetails = useMemo(() => {
    const currentIndex = quiz?.currentQuestionIndex;
    // navigationHistory property doesn't exist in current quiz state
    const navHistory: any[] = [];
    const lastNav = navHistory[0];

    return {
      currentIndex,
      lastNavFrom: lastNav?.from,
      lastNavTo: lastNav?.to,
      lastNavTime: lastNav?.timestamp ? new Date(lastNav.timestamp).toLocaleTimeString() : "N/A",
    };
  }, [quiz]);
  
  // Get relevant localStorage keys for video progress debugging
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Filter localStorage keys related to video progress
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('video-progress') || key.includes('course-completed'))) {
        keys.push(key);
      }
    }
    setLocalStorageKeys(keys);
  }, [lastUpdated, open]);
  
  // Extract video progress debug info
  const videoProgressDebug = useMemo(() => {
    return {
      currentVideoId: course?.currentVideoId,
      currentCourseId: course?.currentCourseId,
      hasProgressData: Object.keys(course?.videoProgress || {}).length > 0,
      progressKeys: Object.keys(course?.videoProgress || {}),
      bookmarkKeys: Object.keys(course?.bookmarks || {}),
      autoplayEnabled: course?.autoplayEnabled,
    };
  }, [course]);

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
          <div className="bg-primary/10 dark:bg-primary/5 mb-2 p-2 rounded text-xs border border-primary/20">
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
          
          {/* Video Progress Debug Section */}
          <div className="bg-warning/10 dark:bg-warning/5 mb-3 p-2 rounded text-xs border border-warning/20">
            <p>
              <strong>Video Progress Debug:</strong>{" "}
              {new Date(lastUpdated).toLocaleTimeString()}
            </p>
            <p>Current Video ID: {videoProgressDebug.currentVideoId || "None"}</p>
            <p>Current Course ID: {videoProgressDebug.currentCourseId || "None"}</p>
            <p>Has Progress Data: {videoProgressDebug.hasProgressData ? "Yes" : "No"}</p>
            <p>Progress Keys: {videoProgressDebug.progressKeys.join(', ') || "None"}</p>
            <p>Bookmark Keys: {videoProgressDebug.bookmarkKeys.join(', ') || "None"}</p>
            <p>Autoplay: {videoProgressDebug.autoplayEnabled ? "Enabled" : "Disabled"}</p>
            <details>
              <summary className="cursor-pointer">localStorage Keys</summary>
              <ul className="ml-2 mt-1 list-disc list-inside">
                {localStorageKeys.map((key, idx) => (
                  <li key={idx} className="truncate">{key}</li>
                ))}
              </ul>
            </details>
          </div>

          <details open>
            <summary className="font-bold text-primary mb-1 cursor-pointer">quiz</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(quiz, null, 2)}</pre>
          </details>          
          {/* Prioritize course state for debugging */}
          <details open>
            <summary className="font-bold text-primary mb-1 cursor-pointer">Course</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(course, null, 2)}</pre>
          </details>
          
          {/* Session-based Auth Info */}
          <details open>
            <summary className="font-bold text-success mb-1 cursor-pointer">Session Auth (NEW)</summary>
            <div className="space-y-2">
              <div>
                <div className="font-semibold text-sm">Session Status: {status}</div>
                <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(session, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold text-sm">Auth User:</div>
                <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(authUser, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold text-sm">Auth Subscription:</div>
                <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify({ plan, credits }, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold text-sm">Is Authenticated: {isAuthenticated.toString()}</div>
                <div className="font-semibold text-sm">Is Loading: {isLoading.toString()}</div>
              </div>
            </div>
          </details>          
          {/* Redux State (Remaining non-auth slices) */}
          <details>
            <summary className="font-bold text-primary mb-1 cursor-pointer">flashcard</summary>
            <pre className="overflow-x-auto bg-muted p-2 rounded text-xs">{JSON.stringify(flashcard, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
