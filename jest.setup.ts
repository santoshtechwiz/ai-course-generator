import "@testing-library/jest-dom"
import { TextEncoder, TextDecoder } from "util"
import { jest } from "@jest/globals"

// Polyfill for TextEncoder/TextDecoder which Next.js needs
global.TextEncoder = TextEncoder
// Add TextDecoder which was missing
global.TextDecoder = TextDecoder as any

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

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

global.ResizeObserver = ResizeObserverMock as any

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0)

// Mock scrollTo
window.scrollTo = jest.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url")

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true,
  }),
) as jest.Mock

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "",
    query: {},
    asPath: "",
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}))

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(() => null),
}))

// Mock HTMLCanvasElement
class MockHTMLCanvasElement {
  getContext() {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(0),
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({
        width: 0,
      })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    }
  }
  toDataURL() {
    return ""
  }
  toBlob() {
    return null
  }
}

global.HTMLCanvasElement = MockHTMLCanvasElement as any

// Mock requestIdleCallback
window.requestIdleCallback = jest.fn((callback) => {
  callback({} as IdleDeadline)
  return 0
})
