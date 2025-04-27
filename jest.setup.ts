import "@testing-library/jest-dom"
import { TextEncoder, TextDecoder } from "util"
import { jest } from "@jest/globals"

// Polyfill for TextEncoder/TextDecoder which Next.js needs
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
  constructor(callback: IntersectionObserverCallback) {}
}

global.IntersectionObserver = MockIntersectionObserver as any

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

Object.defineProperty(window, "localStorage", { value: localStorageMock })
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock })
