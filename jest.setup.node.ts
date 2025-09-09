import { TextEncoder, TextDecoder } from "util"
import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Mock logger for tests
jest.mock('./lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}))

// Mock fetch globally for integration tests
global.fetch = jest.fn()

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

// Mock window object for Node.js environment
const windowMock = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  matchMedia: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  IntersectionObserver: class MockIntersectionObserver {
    observe = jest.fn()
    unobserve = jest.fn()
    disconnect = jest.fn()
    constructor(callback: IntersectionObserverCallback) {}
  },
}

// Set up global mocks
global.localStorage = localStorageMock as any
global.sessionStorage = sessionStorageMock as any
global.window = windowMock as any

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})
