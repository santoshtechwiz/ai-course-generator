import { renderHook, act } from '@testing-library/react' // Updated import
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

// Save original location and properly mock it
const originalLocation = window.location
delete window.location

// Add proper URL mocking with a more complete implementation
const mockWindowLocation = {
  search: '',
  href: 'https://example.com',
  pathname: '/',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: () => 'https://example.com',
};

// Mock URL search params
const mockURLSearchParams = {
  get: jest.fn(),
  has: jest.fn(),
  toString: () => ''
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
    // Reset all mocks
    jest.resetAllMocks(); 
    
    // Reset URL search params mock functions
    mockURLSearchParams.get.mockImplementation(param => {
      if (param === 'fromAuth') return null;
      if (param === 'redirect') return null;
      return null;
    });
    mockURLSearchParams.has.mockImplementation(param => {
      if (param === 'fromAuth') return false;
      if (param === 'redirect') return false;
      return false;
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation, search: '' },
      writable: true
    });
    
    // Mock URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation(() => mockURLSearchParams);
    
    // Mock authenticated session by default
    (useSession as jest.Mock).mockReturnValue({
      data: { 
        user: { id: 'test-user-id' } 
      },
      status: 'authenticated'
    });
  });

  afterAll(() => {
    window.location = originalLocation;
  });
  
  test('should return authenticated status when session exists', () => {
    // Explicitly mock the session to ensure it has expected structure
    (useSession as jest.Mock).mockReturnValue({
      data: { 
        user: { id: 'test-user-id' } 
      },
      status: 'authenticated'
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Verify authenticated status
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
    // Set the search params to include fromAuth=true
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation, search: '?fromAuth=true' },
      writable: true
    });
    
    // Configure the mock to return true for fromAuth
    mockURLSearchParams.get.mockImplementation(param => {
      if (param === 'fromAuth') return 'true';
      return null;
    });
    mockURLSearchParams.has.mockImplementation(param => {
      if (param === 'fromAuth') return true;
      return false;
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.fromAuth).toBe(true);
  });

  test('should not detect fromAuth when parameter is missing', () => {
    // Ensure fromAuth is not present in the URL
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation, search: '?otherParam=value' },
      writable: true
    });
    
    mockURLSearchParams.has.mockReturnValue(false);
    mockURLSearchParams.get.mockImplementation(param => {
      if (param === 'fromAuth') return null;
      if (param === 'otherParam') return 'value';
      return null;
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.fromAuth).toBe(false);
  });
  
  test('should call signIn when requireAuth is called and user is unauthenticated', async () => {
    const signInMock = jest.fn();
    (signIn as jest.Mock).mockImplementation(signInMock);
    
    // Set unauthenticated session
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
    });
    
    const signInMock = jest.fn();
    (signIn as jest.Mock).mockImplementation(signInMock);
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.requireAuth('/callback');
    });
    
    expect(signInMock).not.toHaveBeenCalled();
  });
  
  test('should parse redirect info from URL', () => {
    // Set URL with redirect parameter
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation, search: '?redirect=/dashboard/quizzes' },
      writable: true
    });
    
    // Configure the mock to return the redirect path
    mockURLSearchParams.get.mockImplementation(param => {
      if (param === 'redirect') return '/dashboard/quizzes';
      return null;
    });
    mockURLSearchParams.has.mockImplementation(param => {
      if (param === 'redirect') return true;
      return false;
    });
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.getAuthRedirectInfo()).toEqual({ 
      path: '/dashboard/quizzes' 
    });
  });
  
  test('should handle missing redirect info', () => {
    // Set URL without redirect parameter
    Object.defineProperty(window, 'location', {
      value: { ...mockWindowLocation, search: '' },
      writable: true
    });
    
    // Configure the mock to return null for redirect
    mockURLSearchParams.get.mockReturnValue(null);
    mockURLSearchParams.has.mockReturnValue(false);
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.getAuthRedirectInfo()).toBeNull();
  });
});

// Test the mock creator function
describe('_createMockUseAuth', () => {
  test('should create default mock', () => {
    const mock = _createMockUseAuth();
    
    expect(mock.userId).toBe('test-user-id');
    expect(mock.isAuthenticated).toBe(true);
    expect(mock.status).toBe('authenticated');
    expect(mock.fromAuth).toBe(false);
    expect(typeof mock.signIn).toBe('function');
    expect(typeof mock.signOut).toBe('function');
    expect(typeof mock.requireAuth).toBe('function');
    expect(typeof mock.getAuthRedirectInfo).toBe('function');
  });
  
  test('should override defaults', () => {
    const mock = _createMockUseAuth({
      userId: 'custom-id',
      isAuthenticated: false,
      status: 'unauthenticated'
    });
    
    expect(mock.userId).toBe('custom-id');
    expect(mock.isAuthenticated).toBe(false);
    expect(mock.status).toBe('unauthenticated');
  });
});
