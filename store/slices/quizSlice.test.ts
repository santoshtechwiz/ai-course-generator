import { configureStore } from "@reduxjs/toolkit";
import quizReducer, {

fetchQuiz,
submitQuiz,
initializeQuiz,
restoreQuizAfterAuth,
submitQuizAndPrepareResults,
checkAuthAndLoadResults,
fetchQuizResults,
rehydrateQuizState,
setCurrentQuestionIndex,
saveAnswer,
resetQuiz,
clearResetFlag,
setQuizResults,
setPendingQuiz,
resetPendingQuiz,
hydrateQuiz,
clearPendingQuiz,
setAuthRedirect,
clearAuthRedirect,
setResultsRedirect,
clearResultsRedirect,
setQuizCompleted,
setQuizId,
setQuizType,
setSessionId,
selectQuizState,
selectQuestions,
selectAnswers,
selectQuizStatus,
selectQuizError,
selectCurrentQuestionIndex,
selectIsQuizComplete,
selectQuizResults,
selectQuizTitle,
selectQuizId,
selectCurrentQuestion,
selectShouldRedirectToAuth,
selectShouldRedirectToResults,
selectAuthRedirectUrl,
selectOrGenerateQuizResults,
selectPendingQuiz,
selectAnswerForQuestion,
restoreAuthRedirectState,
} from "./quizSlice";

describe("quizSlice", () => {
let store: ReturnType<typeof configureStore>;

beforeEach(() => {
    store = configureStore({
        reducer: {
            quiz: quizReducer,
        },
    });
});

it("should initialize with the correct initial state", () => {
    const state = store.getState().quiz;
    expect(state).toEqual({
        slug: null,
        quizId: null,
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
    });
});

it("should handle setCurrentQuestionIndex action", () => {
    store.dispatch(setCurrentQuestionIndex(2));
    const state = store.getState().quiz;
    expect(state.currentQuestionIndex).toBe(2);
});

it("should handle saveAnswer action", () => {
    const answer = { questionId: "1", answer: { selectedOptionId: "A", isCorrect: true } };
    store.dispatch(saveAnswer(answer));
    const state = store.getState().quiz;
    expect(state.answers["1"]).toEqual(answer.answer);
});

it("should handle resetQuiz action", () => {
    store.dispatch(resetQuiz());
    const state = store.getState().quiz;
    expect(state).toMatchObject({
        status: "idle",
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        isCompleted: false,
        results: null,
        error: null,
        pendingQuiz: null,
        wasReset: true,
    });
});

it("should handle clearResetFlag action", () => {
    store.dispatch(clearResetFlag());
    const state = store.getState().quiz;
    expect(state.wasReset).toBe(false);
});

it("should handle setQuizResults action", () => {
    const results = { score: 5, maxScore: 10 };
    store.dispatch(setQuizResults(results));
    const state = store.getState().quiz;
    expect(state.results).toEqual(results);
    expect(state.status).toBe("success");
});

it("should handle setPendingQuiz action", () => {
    const pendingQuiz = { slug: "quiz-slug", quizData: { title: "Sample Quiz" }, currentState: {} };
    store.dispatch(setPendingQuiz(pendingQuiz));
    const state = store.getState().quiz;
    expect(state.pendingQuiz).toEqual(pendingQuiz);
});

it("should handle resetPendingQuiz action", () => {
    store.dispatch(resetPendingQuiz());
    const state = store.getState().quiz;
    expect(state.pendingQuiz).toBeNull();
});

it("should handle hydrateQuiz action", () => {
    const payload = {
        slug: "quiz-slug",
        quizData: { title: "Sample Quiz", questions: [{ id: "1", text: "Question 1" }] },
        currentState: { answers: { "1": { selectedOptionId: "A", isCorrect: true } } },
    };
    store.dispatch(hydrateQuiz(payload));
    const state = store.getState().quiz;
    expect(state.slug).toBe("quiz-slug");
    expect(state.title).toBe("Sample Quiz");
    expect(state.questions).toEqual(payload.quizData.questions);
    expect(state.answers).toEqual(payload.currentState.answers);
});

it("should handle setAuthRedirect action", () => {
    store.dispatch(setAuthRedirect("/auth-redirect"));
    const state = store.getState().quiz;
    expect(state.shouldRedirectToAuth).toBe(true);
    expect(state.authRedirectState?.callbackUrl).toBe("/auth-redirect");
});

it("should handle clearAuthRedirect action", () => {
    store.dispatch(clearAuthRedirect());
    const state = store.getState().quiz;
    expect(state.shouldRedirectToAuth).toBe(false);
    expect(state.authRedirectState).toBeNull();
});

it("should handle setResultsRedirect action", () => {
    store.dispatch(setResultsRedirect());
    const state = store.getState().quiz;
    expect(state.shouldRedirectToResults).toBe(true);
});

it("should handle clearResultsRedirect action", () => {
    store.dispatch(clearResultsRedirect());
    const state = store.getState().quiz;
    expect(state.shouldRedirectToResults).toBe(false);
});

it("should handle setQuizCompleted action", () => {
    store.dispatch(setQuizCompleted());
    const state = store.getState().quiz;
    expect(state.isCompleted).toBe(true);
});

it("should handle setQuizId action", () => {
    store.dispatch(setQuizId("quiz-id"));
    const state = store.getState().quiz;
    expect(state.quizId).toBe("quiz-id");
    expect(state.slug).toBe("quiz-id");
});

it("should handle setQuizType action", () => {
    store.dispatch(setQuizType("openended"));
    const state = store.getState().quiz;
    expect(state.quizType).toBe("openended");
});

it("should handle setSessionId action", () => {
    store.dispatch(setSessionId("session-id"));
    const state = store.getState().quiz;
    expect(state.sessionId).toBe("session-id");
});

it("should handle async thunk fetchQuiz", async () => {
    const mockResponse = {
        slug: "quiz-slug",
        id: "quiz-id",
        type: "mcq",
        title: "Sample Quiz",
        questions: [{ id: "1", text: "Question 1" }],
    };
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        })
    ) as jest.Mock;

    await store.dispatch(fetchQuiz({ slug: "quiz-slug", type: "mcq" }) as any);
    const state = store.getState().quiz;
    expect(state.slug).toBe("quiz-slug");
    expect(state.title).toBe("Sample Quiz");
    expect(state.questions).toEqual(mockResponse.questions);
});

it("should handle async thunk submitQuiz", async () => {
    // Set up the initial state correctly
    store = configureStore({
        reducer: {
            quiz: quizReducer,
        },
        preloadedState: {
            quiz: {
                quizId: "quiz-id",
                quizType: "mcq",
                questions: [{ id: "1", answer: "A" }],
                answers: { "1": { selectedOptionId: "A", isCorrect: true } },
                slug: "quiz-slug",
                title: "Test Quiz",
                currentQuestionIndex: 0,
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
        }
    });

    // Dispatch the action
    const result = await store.dispatch(submitQuiz() as any);
    
    // Assert expected outcomes
    expect(result.payload).toMatchObject({
        quizId: "quiz-id",
        quizType: "mcq",
        score: 1,
        maxScore: 1
    });
});
});