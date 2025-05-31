import { createSlice, createAsyncThunk, type PayloadAction, createSelector } from "@reduxjs/toolkit"
import type { RootState } from "../index"
import { QuizType } from "@/types/quiz"

export interface QuizState {
  quizId: string | null  // Keep for database compatibility
  quizType: QuizType | null  // Keep for database compatibility
  title: string
  questions: any[]
  currentQuestionIndex: number
  answers: { [questionId: string]: any }
  isCompleted: boolean
  results: any | null
  error: string | null
  status: "idle" | "loading" | "succeeded" | "failed" | "submitting"
  sessionId: string | null
  pendingQuiz: { slug: string; quizData: any; currentState?: any } | null
  authRedirectState: { callbackUrl: string; quizState: any } | null
  shouldRedirectToAuth: boolean
  shouldRedirectToResults: boolean
  authStatus: "checking" | "authenticated" | "unauthenticated" | "idle"
  slug: string | null  // Primary identifier for UI operations
}

const initialState: QuizState = {
  slug: null, // Primary identifier for UI operations
  quizId: null, // Keep for database compatibility
  quizType: "mcq",
  title: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
  results: null,
  error: null,
  status: "idle",
  sessionId: null,
  pendingQuiz: null,
  authRedirectState: null,
  shouldRedirectToAuth: false,
  shouldRedirectToResults: false,
  authStatus: "idle",
}

// Backward compatible: Keep existing fetchQuiz thunk
export const fetchQuiz = createAsyncThunk(
  "quiz/fetchQuiz",
  async ({ slug, data, type }: { slug: string; data?: any; type: QuizType }, { rejectWithValue }) => {
    try {
      const questions = data?.questions?.map((q: any) => ({ ...q, type })) || [];
      if (data) {
        return {
          slug,
          id: slug,
          type: data.type || type,
          title: data.title || "Untitled Quiz",
          questions,
        };
      }

      const response = await fetch(`/api/quizzes/${type}/${slug}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? `Quiz not found: ${slug}` : `Failed to fetch quiz: ${response.status}`);
      }

      const quizData = await response.json();

      return {
        slug: quizData.slug || slug,
        id: quizData.id || slug,
        type: quizData.type || type,
        title: quizData.title || "Untitled Quiz",
        questions: quizData.questions || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
)

// Backward compatible: Keep existing submitQuiz thunk
export const submitQuiz = createAsyncThunk("quiz/submitQuiz", async (_, { getState, rejectWithValue }) => {
  const state = getState() as RootState
  const { quizId, quizType, questions, answers } = state.quiz

  try {
    let score = 0
    let totalAnswered = 0

    const questionResults = questions.map((question) => {
      const answer = answers[String(question.id)]
      let isCorrect = false
      let userAnswer = null

      if (!answer) {
        return {
          questionId: question.id,
          isCorrect: false,
          userAnswer: null,
          correctAnswer: question.answer,
          skipped: true,
        }
      }

      totalAnswered++

      if (question.type === "blanks" && answer && "filledBlanks" in answer) {
        const mainBlankId = Object.keys(answer.filledBlanks)[0]
        const userAnswerText = answer.filledBlanks[mainBlankId]?.toLowerCase().trim()
        const correctAnswer = question.answer.toLowerCase().trim()
        isCorrect = userAnswerText === correctAnswer
        if (isCorrect) score++
        userAnswer = answer.filledBlanks
      } else if (question.type === "openended" && answer && "text" in answer) {
        isCorrect = Boolean(answer.text.trim())
        if (isCorrect) score++
        userAnswer = answer.text
      } else if (answer && "selectedOption" in answer) {
        isCorrect = answer.isCorrect === true
        if (isCorrect) score++
        userAnswer = answer.selectedOption
      } else if (answer && "selectedOptionId" in answer) {
        isCorrect = answer.isCorrect === true
        if (isCorrect) score++
        userAnswer = answer.selectedOptionId
      }

      return {
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.answer,
        skipped: false,
      }
    })

    const results = {
      quizId,
      quizType,
      score,
      maxScore: questions.length,
      totalAnswered,
      percentage: Math.round((score / questions.length) * 100),
      submittedAt: new Date().toISOString(),
      questionResults,
    }

    return results
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

// Thunk: Initialize quiz with auth check
export const initializeQuiz = createAsyncThunk(
  "quiz/initializeQuiz",
  async (
    { slug, quizData, authStatus, quizType }: { slug: string; quizData?: any; authStatus: string; quizType: QuizType },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;

    // If not authenticated, prepare for auth redirect
    if (authStatus !== "authenticated") {
      const currentState = {
        currentQuestionIndex: state.quiz.currentQuestionIndex,
        answers: state.quiz.answers,
        isCompleted: state.quiz.isCompleted,
      };

      dispatch(setPendingQuiz({ slug, quizData, currentState }))
      dispatch(setAuthRedirect(`/dashboard/common/${quizType}/${slug}`))
      return { requiresAuth: true }
    }

    // If authenticated, load quiz
    if (quizData) {
      return {
        quizData: {
          id: slug,
          type: quizType,
          title: quizData.title || `${quizType.toUpperCase()} Quiz`,
          questions: quizData.questions || [],
        },
      }
    }

    // Fetch from API if no data provided
    const response = await fetch(`/api/quizzes/${quizType}/${slug}`)
    if (!response.ok) {
      throw new Error(`Failed to load quiz: ${response.status}`)
    }
    const data = await response.json()

    return {
      quizData: {
        id: slug,
        type: quizType,
        title: data.title || `${quizType.toUpperCase()} Quiz`,
        questions: data.questions || [],
      },
    }
  },
)

// Thunk: Restore quiz after authentication
export const restoreQuizAfterAuth = createAsyncThunk("quiz/restoreQuizAfterAuth", async (_, { getState, dispatch }) => {
  const state = getState() as RootState

  // Try to get pending quiz from state or sessionStorage
  let pendingQuiz = state.quiz.pendingQuiz

  if (!pendingQuiz && typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("pendingQuiz")
      if (stored) {
        pendingQuiz = JSON.parse(stored)
      }
    } catch (err) {
      console.error("Failed to restore pending quiz:", err)
    }
  }

  if (pendingQuiz) {
    dispatch(clearAuthRedirect())
    return pendingQuiz
  }

  throw new Error("No pending quiz to restore")
})

// Thunk: Submit quiz and prepare results
export const submitQuizAndPrepareResults = createAsyncThunk(
  "quiz/submitQuizAndPrepareResults",
  async ({ slug }: { slug: string }, { getState }) => {
    const state = getState() as RootState
    const { questions, answers, title } = state.quiz

    // Calculate results
    let score = 0
    const questionResults = questions.map((question) => {
      const answer = answers[String(question.id)]
      const isCorrect = answer?.isCorrect === true
      if (isCorrect) score++

      return {
        questionId: question.id,
        isCorrect,
        userAnswer: answer?.selectedOptionId || null,
        correctAnswer: question.correctOptionId || question.answer,
      }
    })

    const results = {
      quizId: state.quiz.quizId, // Keep for database compatibility
      slug,                      // Primary identifier for UI
      title: title || "Quiz Results",
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      completedAt: new Date().toISOString(),
      questions,
      answers: Object.values(answers),
      questionResults,
    }

    return results
  },
)

// Thunk: Check auth and load results
export const checkAuthAndLoadResults = createAsyncThunk(
  "quiz/checkAuthAndLoadResults",
  async ({ slug, authStatus }: { slug: string; authStatus: string }, { getState, dispatch }) => {
    // If not authenticated, trigger auth redirect
    if (authStatus !== "authenticated") {
      dispatch(setAuthRedirect(`/dashboard/mcq/${slug}/results`))
      return { requiresAuth: true }
    }

    const state = getState() as RootState

    // If we have results, return them
    if (state.quiz.results) {
      return { results: state.quiz.results }
    }

    // Generate results from current state if possible
    const { questions, answers, title } = state.quiz
    if (questions.length > 0 && Object.keys(answers).length > 0) {
      let score = 0
      const questionResults = questions.map((question) => {
        const answer = answers[String(question.id)]
        const isCorrect = answer?.isCorrect === true
        if (isCorrect) score++

        return {
          questionId: question.id,
          isCorrect,
          userAnswer: answer?.selectedOptionId || null,
          correctAnswer: question.correctOptionId || question.answer,
        }
      })

      const results = {
        quizId: state.quiz.quizId,
        slug,
        title: title || "Quiz Results",
        score,
        maxScore: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        completedAt: new Date().toISOString(),
        questions,
        answers: Object.values(answers),
        questionResults,
      }

      return { results }
    }

    throw new Error("No quiz results available")
  },
)

// Backward compatible: Keep existing fetchQuizResults thunk
export const fetchQuizResults = createAsyncThunk(
  "quiz/fetchResults",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/quizzes/results/${slug}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz results: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      // Handle the "no results available" case more gracefully
      if (error?.response?.status === 404 || 
          error?.message?.includes("No quiz results") || 
          error?.includes?.("No quiz results")) {
        return rejectWithValue("NO_RESULTS_REDIRECT_TO_QUIZ");
      }
      console.error("Error fetching quiz results:", error);
      return rejectWithValue(error?.message || "Failed to get quiz results");
    }
  },
)

// Improved rehydrateQuiz action to handle results properly
export const rehydrateQuizState = createAsyncThunk(
  "quiz/rehydrateState",
  async (pendingQuiz: { slug: string; quizData: any; currentState: any }, { getState, dispatch }) => {
    try {
      const state = getState() as RootState;
      const { slug, quizData, currentState } = pendingQuiz;
      
      // If we have data directly, use it
      if (quizData?.questions?.length > 0) {
        // Set questions and quiz data
        dispatch(setQuiz({
          quizId: slug,
          title: quizData.title || "Quiz",
          questions: quizData.questions,
          type: quizData.type || "code"
        }));
        
        // If we have saved answers, restore them
        if (currentState?.answers && Object.keys(currentState.answers).length > 0) {
          // Restore each answer
          Object.entries(currentState.answers).forEach(([questionId, answer]) => {
            dispatch(saveAnswer({
              questionId,
              answer
            }));
          });
        }
        
        // If showResults is true, set the completion flag
        if (currentState?.showResults) {
          dispatch(setQuizCompleted());
        }
        
        // If we have results, set them
        if (currentState?.results) {
          dispatch(setQuizResults(currentState.results));
        }
        
        return pendingQuiz;
      }
      
      // If we don't have data directly, need to fetch the quiz
      const response = await fetch(`/api/quizzes/${pendingQuiz.quizData.type}/${slug}`)
      if (!response.ok) {
        throw new Error(`Failed to load quiz: ${response.status}`)
      }
      const data = await response.json()

      dispatch(setQuiz({
        quizId: slug,
        title: data.title || "Quiz",
        questions: data.questions,
        type: data.type || "code"
      }));

      return pendingQuiz;
    } catch (error) {
      console.error("Error rehydrating quiz:", error);
      return null;
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload
    },

    saveAnswer: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      const { questionId, answer } = action.payload
      const normalizedId = String(questionId)

      // Handle different quiz types and validate answers
      if (answer.type === "mcq" && "selectedOptionId" in answer) {
        const question = state.questions.find((q) => String(q.id) === normalizedId)
        if (question) {
          const correctAnswer = question.correctOptionId || question.answer
          answer.isCorrect = answer.selectedOptionId === correctAnswer
        }
      } else if (answer.type === "code" && "selectedOptionId" in answer) {
        const question = state.questions.find((q) => String(q.id) === normalizedId)
        if (question) {
          // For code quizzes, correctOptionId or correctAnswer could be used
          const correctAnswer = question.correctOptionId || question.correctAnswer || question.answer
          answer.isCorrect = answer.selectedOptionId === correctAnswer
        }
      } else if (answer.type === "blanks" && "filledBlanks" in answer) {
        const question = state.questions.find((q) => String(q.id) === normalizedId)
        if (question) {
          const mainBlankId = Object.keys(answer.filledBlanks)[0]
          const userAnswerText = answer.filledBlanks[mainBlankId]?.toLowerCase().trim()
          const correctAnswer = question.answer?.toLowerCase().trim() || ""
          answer.isCorrect = userAnswerText === correctAnswer
        }
      } else if (answer.type === "openended" && "text" in answer) {
        answer.isCorrect = answer.text.trim().length > 0
      }

      state.answers[normalizedId] = answer

      // Check if all questions have been answered
      const allAnswered = state.questions.every((q) => !!state.answers[String(q.id)])
      const isLastQuestion = state.currentQuestionIndex === state.questions.length - 1
      const answeredCount = Object.keys(state.answers).length
      const isComplete = allAnswered || (isLastQuestion && answeredCount === state.questions.length)

      state.isCompleted = isComplete
    },

    resetQuiz: (state) => {
      state.currentQuestionIndex = 0
      state.answers = {}
      state.isCompleted = false
      state.results = null
      state.error = null
      state.status = "idle"
      state.shouldRedirectToAuth = false
      state.shouldRedirectToResults = false
    },

    setQuizResults: (state, action: PayloadAction<any>) => {
      state.results = action.payload;
      state.status = "success";
      state.error = null;
    },
    
    setPendingQuiz: (state, action: PayloadAction<{ slug: string; quizData: any; currentState?: any }>) => {
      state.pendingQuiz = action.payload
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('pendingQuiz', JSON.stringify(action.payload))
        } catch (error) {
          console.error("Failed to save pending quiz to sessionStorage:", error)
        }
      }
    },

    resetPendingQuiz: (state) => {
      state.pendingQuiz = null
    },
    // Rename to hydrateQuiz to avoid conflict with the async thunk
    hydrateQuiz: (state, action: PayloadAction<{ slug: string; quizData: any; currentState?: any }>) => {
      const { slug, quizData, currentState } = action.payload
      
      // Ensure slug is always a string and set as primary identifier
      const sanitizedSlug = typeof slug === 'string' ? slug : String(slug)
      state.slug = sanitizedSlug
      state.quizId = sanitizedSlug  // Keep for database compatibility
      
      state.currentQuestionIndex = 0
      state.error = null
      state.status = "idle"
      state.quizType = "mcq"
      
      // Always populate the questions from quizData if available
      if (quizData?.questions?.length) {
        state.title = quizData?.title || state.title || ""
        state.questions = quizData.questions
      }
      
      // Don't reset answers if we have existing ones and currentState.showResults is true
      if (!(currentState?.showResults && Object.keys(state.answers).length > 0)) {
        state.answers = currentState?.answers || {}
      }
      
      state.isCompleted = currentState?.isCompleted || false
      
      // Special handling for results when showResults is true
      if (currentState?.showResults) {
        // If we have explicit results from currentState, use them
        if (currentState.results) {
          state.results = currentState.results
          state.status = "succeeded"
          console.log("Using results from currentState")
        } else {
          // Try to find results from storage using slug
          try {
            if (typeof window !== 'undefined') {
              // Try with exact slug
              const storedResults = sessionStorage.getItem(`quiz_results_${slug}`)
              if (storedResults) {
                try {
                  state.results = JSON.parse(storedResults)
                  state.status = "succeeded"
                  console.log("Restored results from sessionStorage", state.results)
                } catch (e) {
                  console.error("Failed to parse stored quiz results:", e)
                }
              }
            }
          } catch (e) {
            console.error("Error accessing sessionStorage:", e)
          }
          
          // If still no results, try to compute them from questions and answers or from the quiz data itself
          if (!state.results) {
            // If we don't have answers but have quiz data, create a default set of answers
            if (Object.keys(state.answers).length === 0 && state.questions.length > 0) {
              // Create default answers for all questions (unmarked/incorrect)
              state.questions.forEach(question => {
                state.answers[String(question.id)] = {
                  questionId: question.id,
                  selectedOptionId: null,
                  isCorrect: false,
                  type: "mcq"
                }
              });
            }
            
            // Generate results if we have both questions and answers
            if (state.questions.length > 0) {
              try {
                // Process each question and check if the answer is correct
                let score = 0
                const questionResults = state.questions.map((question: any) => {
                  const answer = state.answers[String(question.id)]
                  const isCorrect = answer?.isCorrect === true
                  if (isCorrect) score++
                  return {
                    questionId: question.id,
                    isCorrect,
                    userAnswer: answer?.selectedOptionId || null,
                    correctAnswer: question.correctOptionId || question.answer,
                    question: question.question || question.text,
                    skipped: !answer || !answer.selectedOptionId
                  }
                })
                
                // Create complete results object
                state.results = {
                  quizId: state.quizId,
                  slug: slug,
                  title: state.title || "Quiz Results",
                  score,
                  maxScore: state.questions.length,
                  percentage: state.questions.length > 0 ? Math.round((score / state.questions.length) * 100) : 0,
                  completedAt: new Date().toISOString(),
                  questions: state.questions,
                  answers: Object.values(state.answers),
                  questionResults,
                }
                state.status = "succeeded"
                console.log("Generated quiz results from quiz data:", state.results)
              } catch (e) {
                console.error("Error generating results:", e)
                state.status = "failed"
                state.error = "Failed to generate results. Please try again."
              }
            } else {
              state.status = "failed"
              state.error = "No questions available to show results."
            }
          }
        }
      } else {
        state.currentQuestionIndex = currentState?.currentQuestionIndex || 0
        // Only clear results if not showing results
        state.results = null
      }
      
      state.pendingQuiz = null
    },

    clearPendingQuiz: (state) => {
      state.pendingQuiz = null
    },

    setAuthRedirect: (state, action: PayloadAction<string>) => {
      state.shouldRedirectToAuth = true
      state.authRedirectState = { callbackUrl: action.payload, quizState: null }
    },

    clearAuthRedirect: (state) => {
      state.shouldRedirectToAuth = false
      state.authRedirectState = null
    },

    setResultsRedirect: (state) => {
      state.shouldRedirectToResults = true
    },

    clearResultsRedirect: (state) => {
      state.shouldRedirectToResults = false
    },

    // Backward compatible: Keep existing actions
    setQuizId: (state, action: PayloadAction<string | number>) => {
      // Convert numeric IDs to strings
      const id = String(action.payload)
      state.quizId = id     // Keep for database compatibility
      state.slug = id       // Primary identifier for UI
    },

    setQuizType: (state, action: PayloadAction<string>) => {
      state.quizType = action.payload
    },

    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload
    },
  },

  extraReducers: (builder) => {
    builder
      // Backward compatible: Handle existing fetchQuiz
      .addCase(fetchQuiz.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        if (!action.payload) {
          console.warn("fetchQuiz fulfilled: payload is undefined", action);
          state.status = "failed";
          state.error = "Failed to load quiz data.";
          return;
        }

        const { slug, id, type, title, questions } = action.payload;

        state.status = "succeeded";
        state.slug = slug || "unknown"; // Fallback to "unknown" if slug is missing
        state.quizId = id || slug || "unknown"; // Keep id for compatibility
        state.quizType = type || "mcq"; // Default to "mcq" if type is missing
        state.title = title || "Untitled Quiz"; // Fallback to "Untitled Quiz"
        state.questions = questions || []; // Default to empty array if questions are missing
        state.currentQuestionIndex = 0;
        state.answers = {};
        state.isCompleted = false;
        state.results = null;

        console.info("Quiz loaded successfully:", { slug, id, type, title, questions });
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })

      // Backward compatible: Handle existing submitQuiz
      .addCase(submitQuiz.pending, (state) => {
        state.status = "submitting"
        state.error = null
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })

      // Backward compatible: Handle existing fetchQuizResults
      .addCase(fetchQuizResults.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchQuizResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
      })
      .addCase(fetchQuizResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })

      // Initialize quiz
      .addCase(initializeQuiz.pending, (state) => {
        state.status = "loading"
        state.error = null
        state.authStatus = "checking"
      })
      .addCase(initializeQuiz.fulfilled, (state, action) => {
        if (action.payload.requiresAuth) {
          state.status = "idle"
          state.authStatus = "unauthenticated"
        } else if (action.payload.quizData) {
          state.status = "succeeded"
          state.authStatus = "authenticated"
          state.quizId = action.payload.quizData.id
          state.quizType = action.payload.quizData.type
          state.title = action.payload.quizData.title
          state.questions = action.payload.quizData.questions
        }
      })
      .addCase(initializeQuiz.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to initialize quiz"
      })

      // Restore after auth
      .addCase(restoreQuizAfterAuth.fulfilled, (state, action) => {
        const { slug, quizData, currentState } = action.payload
        state.quizId = slug
        state.slug = slug // Set slug
        state.quizType = "mcq"
        state.title = quizData?.title || ""
        state.questions = quizData?.questions || []

        if (currentState) {
          state.currentQuestionIndex = currentState.currentQuestionIndex || 0
          state.answers = currentState.answers || {}
          state.isCompleted = currentState.isCompleted || false
        }

        state.pendingQuiz = null
        state.shouldRedirectToAuth = false
        state.status = "succeeded"
      })

      // Submit quiz and prepare results
      .addCase(submitQuizAndPrepareResults.pending, (state) => {
        state.status = "submitting"
      })
      .addCase(submitQuizAndPrepareResults.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.results = action.payload
        state.shouldRedirectToResults = true
      })
      .addCase(submitQuizAndPrepareResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to submit quiz"
      })

      // Check auth and load results
      .addCase(checkAuthAndLoadResults.pending, (state) => {
        state.status = "loading"
        state.authStatus = "checking"
      })
      .addCase(checkAuthAndLoadResults.fulfilled, (state, action) => {
        if (action.payload.requiresAuth) {
          state.authStatus = "unauthenticated"
          state.status = "idle"
        } else if (action.payload.results) {
          state.authStatus = "authenticated"
          state.status = "succeeded"
          state.results = action.payload.results
        }
      })
      .addCase(checkAuthAndLoadResults.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to load results"
      })
  },
})

export const {
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  setPendingQuiz,
  resetPendingQuiz,
  hydrateQuiz, // Export the renamed action
  clearPendingQuiz,
  setAuthRedirect,
  clearAuthRedirect,
  setResultsRedirect,
  clearResultsRedirect,
  // Backward compatible exports
  setQuizId,
  setQuizType,
  setSessionId,
 
} = quizSlice.actions

// Selectors - keeping all existing ones for backward compatibility
export const selectQuizState = (state: RootState) => state.quiz
export const selectQuestions = createSelector([selectQuizState], (quiz) => quiz.questions)
export const selectAnswers = createSelector([selectQuizState], (quiz) => quiz.answers)
export const selectQuizStatus = createSelector([selectQuizState], (quiz) => quiz.status)
export const selectQuizError = createSelector([selectQuizState], (quiz) => quiz.error)
export const selectCurrentQuestionIndex = createSelector([selectQuizState], (quiz) => quiz.currentQuestionIndex)
export const selectIsQuizComplete = createSelector([selectQuizState], (quiz) => quiz.isCompleted)
export const selectQuizResults = createSelector([selectQuizState], (quiz) => quiz.results)
export const selectQuizTitle = createSelector([selectQuizState], (quiz) => quiz.title)
export const selectQuizId = createSelector([selectQuizState], (quiz) => quiz.slug || quiz.quizId)
export const selectCurrentQuestion = createSelector(
  [selectQuestions, selectCurrentQuestionIndex],
  (questions, index) => questions[index] || null,
)

// New selectors for auth flow
export const selectShouldRedirectToAuth = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToAuth)
export const selectShouldRedirectToResults = createSelector([selectQuizState], (quiz) => quiz.shouldRedirectToResults)
export const selectAuthRedirectUrl = createSelector([selectQuizState], (quiz) => quiz.authRedirectState?.callbackUrl)

// Backward compatible: Keep existing selectors
export const selectOrGenerateQuizResults = createSelector(
  [selectQuestions, selectAnswers, selectQuizTitle, selectQuizId],
  (questions, answers, title, quizId) => {
    // Don't generate if we have no questions or answers
    if (Object.keys(answers).length === 0 || questions.length === 0) {
      return null;
    }

    // Generate questionResults from answers
    const questionResults = Object.entries(answers).map(([questionId, answerData]) => {
      // Find the matching question to determine if the answer was correct
      const question = questions.find(q => q.id.toString() === questionId);
      let isCorrect = false;
      
      if (question && answerData.selectedOptionId) {
        if (question.answer === answerData.selectedOptionId) {
          isCorrect = true;
        }
      }
      
      return {
        questionId,
        userAnswer: answerData.selectedOptionId || "Not answered",
        selectedOptionId: answerData.selectedOptionId,
        isCorrect
      };
    });
    
    // Calculate score metrics
    const correctCount = questionResults.filter(qr => qr.isCorrect).length;
    const totalCount = questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);
    
    // Return a complete result object
    return {
      quizId,
      slug: quizId,
      title: title || `Quiz ${quizId}`,
      completedAt: new Date().toISOString(),
      maxScore: totalCount,
      score: correctCount,
      percentage,
      questionResults,
      questions
    };
  }
);

export const selectPendingQuiz = (state: RootState) => state.quiz.pendingQuiz;

export default quizSlice.reducer
