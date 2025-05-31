import { renderHook } from '@testing-library/react';
import { useSessionService } from './useSessionService';
import * as ReactRedux from 'react-redux';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Mock Redux hooks
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  __esModule: true,
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock Next.js router
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

// Mock NextAuth useSession
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  __esModule: true,
  useSession: jest.fn(),
}));

describe('useSessionService', () => {
  // Create storage objects for each test
  let mockSessionStorageData = {};
  let mockLocalStorageData = {};
  let mockSessionStorage:any;
  let mockLocalStorage:any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset data objects before each test
    mockSessionStorageData = {};
    mockLocalStorageData = {};
    
    // Create new mock storage with proper closures to maintain state
    mockSessionStorage = {
      getItem: jest.fn(key => mockSessionStorageData[key] || null),
      setItem: jest.fn((key, value) => { mockSessionStorageData[key] = value; }),
      removeItem: jest.fn(key => { delete mockSessionStorageData[key]; }),
      clear: jest.fn(() => { mockSessionStorageData = {}; }),
    };
    
    mockLocalStorage = {
      getItem: jest.fn(key => mockLocalStorageData[key] || null),
      setItem: jest.fn((key, value) => { mockLocalStorageData[key] = value; }),
      removeItem: jest.fn(key => { delete mockLocalStorageData[key]; }),
      clear: jest.fn(() => { mockLocalStorageData = {}; }),
    };

    // Apply mock storage to window
    Object.defineProperty(window, 'sessionStorage', { 
      value: mockSessionStorage,
      writable: true
    });
    Object.defineProperty(window, 'localStorage', { 
      value: mockLocalStorage,
      writable: true
    });

    // Set up other mocks
    (ReactRedux.useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (ReactRedux.useSelector as jest.Mock).mockImplementation((selectorFn) =>
      selectorFn({
        quiz: {
          slug: '',
          quizData: null,
          currentState: {
            answers: {},
            isCompleted: false,
            showResults: false,
            results: null,
          },
        },
      })
    );

    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  it('should save auth redirect state to session storage', () => {
    const { result } = renderHook(() => useSessionService());
    const saveAuthRedirectState = result.current.saveAuthRedirectState;

    const state = {
      returnPath: '/dashboard/blanks/test-quiz/results?fromAuth=true',
      quizState: {
        slug: 'test-quiz',
        quizData: {
          title: 'Test Quiz',
          questions: [],
        },
        currentState: {
          answers: {},
          isCompleted: true,
          showResults: true,
          results: { score: 100 },
        },
      },
    };

    saveAuthRedirectState(state);

    // Based on the error message, verify actual keys used by the implementation
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'callbackUrl',
      '/dashboard/blanks/test-quiz/results?fromAuth=true'
    );

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'pendingQuiz',
      expect.any(String)
    );

    expect(mockSessionStorageData['pendingQuiz']).toBeTruthy();
    expect(mockSessionStorageData['callbackUrl']).toBe('/dashboard/blanks/test-quiz/results?fromAuth=true');
  });

  it('should restore auth redirect state from session storage and dispatch actions', async () => {
    const { result } = renderHook(() => useSessionService());
    const restoreAuthRedirectState = result.current.restoreAuthRedirectState;

    const quizState = {
      slug: 'test-quiz',
      quizData: {
        title: 'Test Quiz',
        questions: [{ id: 1, text: 'Question 1' }],
      },
      currentState: {
        answers: { 1: 'Answer 1' },
        isCompleted: true,
        showResults: true,
        results: { score: 100 },
      },
    };

    // Manually set data in the storage mock using actual keys
    mockSessionStorageData['callbackUrl'] = '/dashboard/blanks/test-quiz/results?fromAuth=true';
    mockSessionStorageData['pendingQuiz'] = JSON.stringify(quizState);
    
    await restoreAuthRedirectState();

    // Check that dispatch was called at least once
    expect(mockDispatch).toHaveBeenCalled();
    
    // Check that the storage items were removed
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('callbackUrl');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('pendingQuiz');
  });

  it('should clear quiz results by dispatching reset actions', () => {
    const { result } = renderHook(() => useSessionService());
    const clearQuizResults = result.current.clearQuizResults;

    clearQuizResults();

    // Check that the reset action was dispatched
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'quiz/resetQuiz'
    }));
  });

  it('should store results in local storage', () => {
    const { result } = renderHook(() => useSessionService());
    const storeResults = result.current.storeResults;

    const slug = 'test-quiz';
    const results = { score: 100 };

    storeResults(slug, results);

    // Based on the implementation, check if we're actually using the right key format
    const expectedKey = `quiz_results_${slug}`;

    // Verify the mock was called correctly with the actual key format
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      expectedKey,
      expect.any(String)
    );
    
    // Verify the data was actually stored with the correct key
    expect(JSON.parse(mockLocalStorageData[expectedKey])).toEqual(results);
  });

  it('should get stored results from local storage', () => {
    const { result } = renderHook(() => useSessionService());
    const getStoredResults = result.current.getStoredResults;

    const slug = 'test-quiz';
    const results = { score: 100 };

    // Manually set data in the storage mock using the actual key format
    const expectedKey = `quiz_results_${slug}`;
    mockLocalStorageData[expectedKey] = JSON.stringify(results);

    const storedResults = getStoredResults(slug);

    // Verify the mock was called with the actual key format
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(expectedKey);
    
    // Verify the correct data was returned
    expect(storedResults).toEqual(results);
  });

  it('should return null if no stored results are found', () => {
    const { result } = renderHook(() => useSessionService());
    const getStoredResults = result.current.getStoredResults;

    const storedResults = getStoredResults('nonexistent-quiz');

    expect(storedResults).toBeNull();
  });
});
