import reducer, {
  setQuizId,
  setQuizType,
  setCurrentQuestionIndex,
  saveAnswer,
  resetQuiz,
  setQuizResults,
  fetchQuiz,
  fetchQuizResults,
  submitQuiz,
  selectQuizState,
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectQuizTitle,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectIsQuizComplete,
  selectQuizId,
  selectQuizResults,
  selectQuizInProgress,
} from "../../store/slices/quizSlice";
import { QuizState, BlankQuizQuestion, OpenEndedQuizQuestion, QuizAnswer } from "@/app/types/quiz-types";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { AnyAction } from "@reduxjs/toolkit";

const blankQuestion: BlankQuizQuestion = {
  id: 1,
  question: "2 + 2 = [[4]]",
  answer: "4",
  type: "blanks",
};
const openQuestion: OpenEndedQuizQuestion = {
  id: 2,
  question: "Explain gravity.",
  answer: "A force that attracts objects.",
  type: "openended",
};

const initialState: QuizState = {
  quizId: null,
  quizType: null,
  title: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  status: "idle",
  error: null,
  isQuizComplete: false,
  results: null,
};

const mockStore = configureStore([thunk]);

describe("quizSlice reducers", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it("setQuizId sets quizId", () => {
    const state = reducer(initialState, setQuizId(123));
    expect(state.quizId).toBe(123);
  });

  it("setQuizType sets quizType", () => {
    const state = reducer(initialState, setQuizType("blanks"));
    expect(state.quizType).toBe("blanks");
  });

  it("setCurrentQuestionIndex sets currentQuestionIndex", () => {
    const state = reducer(initialState, setCurrentQuestionIndex(2));
    expect(state.currentQuestionIndex).toBe(2);
  });

  it("saveAnswer saves answer and updates isQuizComplete", () => {
    const stateWithQuestions = { ...initialState, questions: [blankQuestion, openQuestion] };
    const answer: QuizAnswer = {
      questionId: 1,
      filledBlanks: { blank_0: "4" },
      timestamp: Date.now(),
    };
    let state = reducer(stateWithQuestions, saveAnswer({ questionId: 1, answer }));
    expect(state.answers[1]).toEqual(answer);
    expect(state.isQuizComplete).toBe(false);

    // Save answer for second question
    const answer2: QuizAnswer = {
      questionId: 2,
      text: "A force that attracts objects.",
      timestamp: Date.now(),
    };
    state = reducer(state, saveAnswer({ questionId: 2, answer: answer2 }));
    expect(state.answers[2]).toEqual(answer2);
    expect(state.isQuizComplete).toBe(true);
  });

  it("resetQuiz resets quiz state", () => {
    const modifiedState = {
      ...initialState,
      currentQuestionIndex: 2,
      answers: { 1: { questionId: 1, filledBlanks: { blank_0: "4" }, timestamp: Date.now() } },
      isQuizComplete: true,
      results: { score: 1 },
    };
    const state = reducer(modifiedState, resetQuiz());
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.isQuizComplete).toBe(false);
    expect(state.results).toBeNull();
  });

  it("setQuizResults sets results", () => {
    const results = { score: 2 };
    const state = reducer(initialState, setQuizResults(results));
    expect(state.results).toEqual(results);
  });
});

describe("quizSlice extraReducers (async thunks)", () => {
  it("fetchQuiz.pending sets status/loading", () => {
    const state = reducer(initialState, { type: fetchQuiz.pending.type });
    expect(state.status).toBe("loading");
    expect(state.error).toBeNull();
  });

  it("fetchQuiz.fulfilled sets quiz data", () => {
    const payload = {
      id: 1,
      type: "blanks",
      title: "Test Quiz",
      questions: [blankQuestion],
    };
    const state = reducer(initialState, { type: fetchQuiz.fulfilled.type, payload });
    expect(state.status).toBe("idle");
    expect(state.quizId).toBe(1);
    expect(state.quizType).toBe("blanks");
    expect(state.title).toBe("Test Quiz");
    expect(state.questions).toEqual([blankQuestion]);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.isQuizComplete).toBe(false);
    expect(state.results).toBeNull();
  });

  it("fetchQuiz.rejected sets error", () => {
    const state = reducer(initialState, { type: fetchQuiz.rejected.type, payload: "error" });
    expect(state.status).toBe("error");
    expect(state.error).toBe("error");
  });

  it("fetchQuizResults.pending sets status/loading", () => {
    const state = reducer(initialState, { type: fetchQuizResults.pending.type });
    expect(state.status).toBe("loading");
    expect(state.error).toBeNull();
  });

  it("fetchQuizResults.fulfilled sets results", () => {
    const payload = { score: 1 };
    const state = reducer(initialState, { type: fetchQuizResults.fulfilled.type, payload });
    expect(state.status).toBe("idle");
    expect(state.results).toEqual(payload);
  });

  it("fetchQuizResults.rejected sets error", () => {
    const state = reducer(initialState, { type: fetchQuizResults.rejected.type, payload: "err" });
    expect(state.status).toBe("error");
    expect(state.error).toBe("err");
  });

  it("submitQuiz.pending sets status/submitting", () => {
    const state = reducer(initialState, { type: submitQuiz.pending.type });
    expect(state.status).toBe("submitting");
    expect(state.error).toBeNull();
  });

  it("submitQuiz.fulfilled sets results", () => {
    const payload = { score: 2 };
    const state = reducer(initialState, { type: submitQuiz.fulfilled.type, payload });
    expect(state.status).toBe("idle");
    expect(state.results).toEqual(payload);
  });

  it("submitQuiz.rejected sets error", () => {
    const state = reducer(initialState, { type: submitQuiz.rejected.type, payload: "fail" });
    expect(state.status).toBe("error");
    expect(state.error).toBe("fail");
  });
});

describe("quizSlice selectors", () => {
  const state = {
    quiz: {
      quizId: 1,
      quizType: "blanks",
      title: "Quiz",
      questions: [blankQuestion, openQuestion],
      currentQuestionIndex: 1,
      answers: {
        1: { questionId: 1, filledBlanks: { blank_0: "4" }, timestamp: Date.now() },
        2: { questionId: 2, text: "A force that attracts objects.", timestamp: Date.now() },
      },
      status: "idle",
      error: null,
      isQuizComplete: true,
      results: { score: 2 },
    },
  };

  it("selectQuizState returns quiz state", () => {
    expect(selectQuizState(state as any)).toBe(state.quiz);
  });

  it("selectQuestions returns questions", () => {
    expect(selectQuestions(state as any)).toEqual([blankQuestion, openQuestion]);
  });

  it("selectAnswers returns answers", () => {
    expect(selectAnswers(state as any)).toEqual(state.quiz.answers);
  });

  it("selectQuizStatus returns status", () => {
    expect(selectQuizStatus(state as any)).toBe("idle");
  });

  it("selectQuizError returns error", () => {
    expect(selectQuizError(state as any)).toBeNull();
  });

  it("selectQuizTitle returns title", () => {
    expect(selectQuizTitle(state as any)).toBe("Quiz");
  });

  it("selectCurrentQuestionIndex returns current index", () => {
    expect(selectCurrentQuestionIndex(state as any)).toBe(1);
  });

  it("selectCurrentQuestion returns current question", () => {
    expect(selectCurrentQuestion(state as any)).toEqual(openQuestion);
  });

  it("selectIsQuizComplete returns true if all answered", () => {
    expect(selectIsQuizComplete(state as any)).toBe(true);
  });

  it("selectQuizId returns quizId", () => {
    expect(selectQuizId(state as any)).toBe(1);
  });

  it("selectQuizResults returns results", () => {
    expect(selectQuizResults(state as any)).toEqual({ score: 2 });
  });

  it("selectQuizInProgress returns false if all answered", () => {
    expect(selectQuizInProgress(state as any)).toBe(false);
  });

  it("selectQuizInProgress returns true if some answered", () => {
    const partialState = {
      quiz: {
        ...state.quiz,
        answers: { 1: { questionId: 1, filledBlanks: { blank_0: "4" }, timestamp: Date.now() } },
      },
    };
    expect(selectQuizInProgress(partialState as any)).toBe(true);
  });

  it("selectIsQuizComplete returns false if not all answered", () => {
    const partialState = {
      quiz: {
        ...state.quiz,
        answers: { 1: { questionId: 1, filledBlanks: { blank_0: "4" }, timestamp: Date.now() } },
      },
    };
    expect(selectIsQuizComplete(partialState as any)).toBe(false);
  });
});

describe("quizSlice async thunks", () => {
  let store: ReturnType<typeof mockStore>;
  beforeEach(() => {
    store = mockStore({ quiz: initialState });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("fetchQuiz resolves with data", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        type: "blanks",
        title: "Quiz",
        questions: [blankQuestion],
      }),
    });
    const result = await store.dispatch<any>(
      fetchQuiz({ id: 1, type: "blanks" })
    );
    expect(result.type).toBe("quiz/fetchQuiz/fulfilled");
    expect(result.payload).toMatchObject({
      id: 1,
      type: "blanks",
      title: "Quiz",
      questions: [expect.objectContaining({ id: 1 })],
    });
  });

  it("fetchQuiz uses provided data", async () => {
    const data = {
      id: 2,
      type: "openended",
      title: "Open Quiz",
      questions: [openQuestion],
    };
    const result = await store.dispatch<any>(
      fetchQuiz({ id: 2, data, type: "openended" })
    );
    expect(result.type).toBe("quiz/fetchQuiz/fulfilled");
    expect(result.payload).toMatchObject({
      id: 2,
      type: "openended",
      title: "Open Quiz",
      questions: [expect.objectContaining({ id: 2 })],
    });
  });

  it("fetchQuiz handles error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    const result = await store.dispatch<any>(
      fetchQuiz({ id: 1, type: "blanks" })
    );
    expect(result.type).toBe("quiz/fetchQuiz/rejected");
    expect(result.payload).toMatch(/Failed to fetch quiz/);
  });

  it("fetchQuizResults resolves with data", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ score: 1 }),
    });
    store = mockStore({ quiz: { ...initialState, quizType: "blanks" } });
    const result = await store.dispatch<any>(fetchQuizResults("slug"));
    expect(result.type).toBe("quiz/fetchQuizResults/fulfilled");
    expect(result.payload).toEqual({ score: 1 });
  });

  it("fetchQuizResults handles error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    store = mockStore({ quiz: { ...initialState, quizType: "blanks" } });
    const result = await store.dispatch<any>(fetchQuizResults("slug"));
    expect(result.type).toBe("quiz/fetchQuizResults/rejected");
    expect(result.payload).toMatch(/Failed to fetch results/);
  });

  it("submitQuiz calculates results", async () => {
    const quizState: QuizState = {
      ...initialState,
      quizId: 1,
      quizType: "blanks",
      questions: [blankQuestion],
      answers: {
        1: {
          questionId: 1,
          filledBlanks: { blank_0: "4" },
          timestamp: Date.now(),
        },
      },
    };
    store = mockStore({ quiz: quizState });
    const result = await store.dispatch<any>(submitQuiz());
    expect(result.type).toBe("quiz/submitQuiz/fulfilled");
    expect(result.payload.score).toBe(1);
    expect(result.payload.maxScore).toBe(1);
    expect(result.payload.questionResults[0].isCorrect).toBe(true);
  });

  it("submitQuiz handles openended", async () => {
    const quizState: QuizState = {
      ...initialState,
      quizId: 2,
      quizType: "openended",
      questions: [openQuestion],
      answers: {
        2: {
          questionId: 2,
          text: "A force that attracts objects.",
          timestamp: Date.now(),
        },
      },
    };
    store = mockStore({ quiz: quizState });
    const result = await store.dispatch<any>(submitQuiz());
    expect(result.type).toBe("quiz/submitQuiz/fulfilled");
    expect(result.payload.score).toBe(1);
    expect(result.payload.maxScore).toBe(1);
    expect(result.payload.questionResults[0].isCorrect).toBe(true);
  });

  it("submitQuiz handles error", async () => {
    const quizState: QuizState = {
      ...initialState,
      quizId: 1,
      quizType: "blanks",
      questions: [blankQuestion],
      answers: {},
    };
    store = mockStore({ quiz: quizState });
    // Simulate error by throwing in the thunk
    const spy = jest.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await store.dispatch<any>(submitQuiz());
    expect(result.type).toBe("quiz/submitQuiz/rejected");
    spy.mockRestore();
  });
});
