import { renderHook, act } from '@testing-library/react-hooks'
import { useAuth, _createMockUseAuth } from '../useAuth'
import { useSession, signIn } from 'next-auth/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock window.location
const originalLocation = window.location
delete window.location

// Add proper URL mocking
const mockWindowLocation = {
  search: '',
  href: 'https://example.com',
  pathname: '/',
};

// Create a mock Redux store
const createTestStore = () => configureStore({
  reducer: {
    auth: (state = { userRedirectState: null, hasRedirectState: false }, action) => {
      if (action.type === 'auth/setUserRedirectState') {
        return { ...state, userRedirectState: action.payload, hasRedirectState: true };
      }
      if (action.type === 'auth/clearUserRedirectState') {
        return { ...state, userRedirectState: null, hasRedirectState: false };
      }
      return state;
    }
  }
});

// Create a wrapper component that provides the Redux store
const createWrapper = () => {
  const store = createTestStore();
  return ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
}

describe('useAuth hook', () => {
  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks(); // Use resetAllMocks instead of clearAllMocks
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation },
      writable: true
    });
    
    // Default session mock
    (useSession as jest.Mock).mockReturnValue({
      data: { 
        user: { id: 'test-user-id' },
        status: 'authenticated'
      }
    });
  });

  afterAll(() => {
    window.location = originalLocation
  })
  
  test('should return authenticated status when session exists', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('test-user-id');
  });

  test('should return unauthenticated status when session is missing', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should detect fromAuth parameter in URL', () => {
    window.location.search = '?fromAuth=true';
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.fromAuth).toBe(true);
  });

  test('should not detect fromAuth when parameter is missing', () => {
    window.location.search = '?otherParam=value'
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.fromAuth).toBe(false)
  })
  
  test('should call signIn when requireAuth is called and user is unauthenticated', async () => {
    const signInMock = jest.fn();
    (signIn as jest.Mock).mockImplementation(signInMock);
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      result.current.requireAuth('/test-callback');
    });
    
    expect(signInMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ callbackUrl: '/test-callback' })
    );
  });

  test('should not call signIn when requireAuth is called but user is authenticated', () => {
    // Mock authenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user-123' } },
      status: 'authenticated'
    })
    
    const signInMock = jest.fn();
    (signIn as jest.Mock).mockImplementation(signInMock);
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    act(() => {
      result.current.requireAuth('/callback')
    })
    
    expect(signInMock).not.toHaveBeenCalled()
  })
  
  test('should parse redirect info from URL', () => {
    // Set URL with redirect parameter
    window.location.search = '?redirect=/dashboard/quizzes'
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.getAuthRedirectInfo()).toEqual({ 
      path: '/dashboard/quizzes' 
    })
  })
  
  test('should handle missing redirect info', () => {
    // Set URL without redirect parameter
    window.location.search = ''
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.getAuthRedirectInfo()).toBeNull()
  })
})

// Test the mock creator function
describe('_createMockUseAuth', () => {
  test('should create default mock', () => {
    const mock = _createMockUseAuth()
    
    expect(mock.userId).toBe('test-user-id')
    expect(mock.isAuthenticated).toBe(true)
    expect(mock.status).toBe('authenticated')
    expect(mock.fromAuth).toBe(false)
    expect(typeof mock.signIn).toBe('function')
    expect(typeof mock.signOut).toBe('function')
    expect(typeof mock.requireAuth).toBe('function')
    expect(typeof mock.getAuthRedirectInfo).toBe('function')
  })
  
  test('should override defaults', () => {
    const mock = _createMockUseAuth({
      userId: 'custom-id',
      isAuthenticated: false,
      status: 'unauthenticated'
    })
    
    expect(mock.userId).toBe('custom-id')
    expect(mock.isAuthenticated).toBe(false)
    expect(mock.status).toBe('unauthenticated')
  })
})
