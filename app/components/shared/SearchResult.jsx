'use client';
type SearchResult = {
  courses: { id: string; name: string; }[];
  quizzes: { id: string; question: string; }[];
};
