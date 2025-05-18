import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import flashcardReducer, {
  initFlashCardQuiz,
  submitFlashCardAnswer,
  resetFlashCards
} from '@/store/slices/flashcardSlice';
import { FlashCardComponent } from '@/app/dashboard/(quiz)/flashcard/components/FlashCardComponent';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

jest.mock('@/providers/animation-provider', () => ({
  useAnimation: () => ({ animationsEnabled: true }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user-id', name: 'Test User' },
    },
    status: 'authenticated',
  }),
}));

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      span: ({ children, ...props }) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    useAnimation: () => ({
      start: jest.fn().mockResolvedValue(undefined),
      set: jest.fn(),
    }),
  };
});

// Sample data
const mockFlashCards = [
  {
    id: 'card-1',
    question: 'What is React?',
    answer: 'A JavaScript library for building user interfaces',
    isSaved: false,
  },
  {
    id: 'card-2',
    question: 'What is Redux?',
    answer: 'A predictable state container for JavaScript apps',
    isSaved: true,
  },
  {
    id: 'card-3',
    question: 'What is TypeScript?',
    answer: 'A superset of JavaScript that adds static typing',
    isSaved: false,
  },
];

describe('FlashCardComponent Tests', () => {
  let store;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    store = configureStore({
      reducer: { flashcard: flashcardReducer },
    });

    store.dispatch(initFlashCardQuiz({
      id: 'test-quiz',
      slug: 'test-quiz-slug',
      title: 'Test Quiz',
      questions: mockFlashCards,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders FlashCardComponent and shows first question', () => {
    render(
      <Provider store={store}>
        <FlashCardComponent
          cards={mockFlashCards}
          quizId="test-quiz"
          slug="test-quiz-slug"
          title="Test Quiz"
          savedCardIds={['card-2']}
        />
      </Provider>
    );

    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('flips card to show answer on click', async () => {
    render(
      <Provider store={store}>
        <FlashCardComponent
          cards={mockFlashCards}
          quizId="test-quiz"
          slug="test-quiz-slug"
          title="Test Quiz"
          savedCardIds={[]}
        />
      </Provider>
    );

    fireEvent.click(screen.getByText('What is React?'));

    await waitFor(() => {
      expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
    });
  });

  it('submits answer as correct on "Got it" click', async () => {
    render(
      <Provider store={store}>
        <FlashCardComponent
          cards={mockFlashCards}
          quizId="test-quiz"
          slug="test-quiz-slug"
          title="Test Quiz"
          savedCardIds={[]}
        />
      </Provider>
    );

    fireEvent.click(screen.getByText('What is React?'));
    await waitFor(() => screen.getByText('A JavaScript library for building user interfaces'));

    fireEvent.click(screen.getByText('Got it'));

    await waitFor(() => {
      const state = store.getState().flashcard;
      expect(state.answers.length).toBe(1);
      expect(state.answers[0].isCorrect).toBe(true);
      expect(state.answers[0].questionId).toBe('card-1');
    });
  });

  it('invokes onSaveCard callback when Save Card is clicked', async () => {
    const mockSaveCard = jest.fn();

    render(
      <Provider store={store}>
        <FlashCardComponent
          cards={mockFlashCards}
          quizId="test-quiz"
          slug="test-quiz-slug"
          title="Test Quiz"
          savedCardIds={[]}
          onSaveCard={mockSaveCard}
        />
      </Provider>
    );

    const saveButton = screen.getByRole('button', { name: /save card/i });
    fireEvent.click(saveButton);

    expect(mockSaveCard).toHaveBeenCalledWith(mockFlashCards[0]);
  });

  it('enters review mode when Review button is clicked', async () => {
    // Submit a mix of correct/incorrect answers
    store.dispatch(submitFlashCardAnswer({
      questionId: 'card-1',
      answer: 'correct',
      isCorrect: true,
      timeSpent: 5
    }));

    store.dispatch(submitFlashCardAnswer({
      questionId: 'card-2',
      answer: 'incorrect',
      isCorrect: false,
      timeSpent: 5
    }));

    store.dispatch({
      type: 'flashcard/completeFlashCardQuiz',
      payload: {
        score: 50,
        answers: [
          { questionId: 'card-1', answer: 'correct', isCorrect: true, timeSpent: 5 },
          { questionId: 'card-2', answer: 'incorrect', isCorrect: false, timeSpent: 5 }
        ],
        completedAt: new Date().toISOString()
      }
    });

    render(
      <Provider store={store}>
        <FlashCardComponent
          cards={mockFlashCards}
          quizId="test-quiz"
          slug="test-quiz-slug"
          title="Test Quiz"
          savedCardIds={[]}
        />
      </Provider>
    );

    const reviewButton = screen.getByText(/Review 1 card/i);
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText(/Review Mode: Test Quiz/i)).toBeInTheDocument();
    });
  });

  it('resets flashcard state correctly', () => {
    store.dispatch(submitFlashCardAnswer({
      questionId: 'card-1',
      answer: 'correct',
      isCorrect: true,
      timeSpent: 5
    }));

    expect(store.getState().flashcard.answers.length).toBe(1);

    store.dispatch(resetFlashCards());

    const state = store.getState().flashcard;
    expect(state.currentQuestion).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.isCompleted).toBe(false);
  });
});
