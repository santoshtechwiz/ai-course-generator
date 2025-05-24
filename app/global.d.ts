// Add mockApi to Window interface
declare global {
  interface Window {
    mockApi: {
      fetchQuiz: (quizId: string) => Promise<any>;
      submitQuiz: (quizId: string, answers: Record<string, any>) => Promise<any>;
    };
  }
}

export {};
