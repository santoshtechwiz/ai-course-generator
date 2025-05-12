"use client"

import { render, screen, fireEvent } from "@testing-library/react"
import MainNavbar from "../MainNavbar"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import useSubscription from "@/hooks/use-subscription"

// Mock the hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}))

jest.mock("@/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}))

jest.mock("@/hooks/use-subscription", () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock the components that we don't want to test
jest.mock("../Logo", () => ({
  __esModule: true,
  default: () => <div data-testid="logo">Logo</div>,
}))

jest.mock("../ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

jest.mock("../MobileMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-menu">Mobile Menu</div>,
}))

jest.mock("../UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}))

jest.mock("../NotificationsMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications-menu">Notifications Menu</div>,
}))

jest.mock("../SearchModal", () => ({
  __esModule: true,
  default: ({ isOpen, setIsOpen, onResultClick }) =>
    isOpen ? (
      <div data-testid="search-modal">
        <button onClick={() => onResultClick("/test")}>Result</button>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
    ) : null,
}))

describe("MainNavbar", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Default mock implementations
    ;(usePathname as jest.Mock).mockReturnValue("/")
    ;(useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    })
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
    ;(useSubscription as jest.Mock).mockReturnValue({
      totalTokens: 0,
      tokenUsage: 0,
      subscriptionPlan: "FREE",
      isLoading: false,
    })

    // Mock window.scrollY
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    })
  })

  it("renders the navbar correctly", () => {
    render(<MainNavbar />)

    expect(screen.getByTestId("main-navbar")).toBeInTheDocument()
    expect(screen.getByTestId("logo")).toBeInTheDocument()
    expect(screen.getByTestId("nav-items")).toBeInTheDocument()
    expect(screen.getByTestId("search-button")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("user-menu")).toBeInTheDocument()
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument()
  })

  it("shows credits when user is authenticated", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "1", credits: 100 },
      isAuthenticated: true,
    })
    ;(useSubscription as jest.Mock).mockReturnValue({
      totalTokens: 200,
      tokenUsage: 50,
      subscriptionPlan: "FREE",
      isLoading: false,
    })

    render(<MainNavbar />)

    expect(screen.getByTestId("credits-display")).toBeInTheDocument()
    expect(screen.getByText("Credits: 150")).toBeInTheDocument()
  })

  it("shows subscription plan badge when not FREE", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "1", credits: 100 },
      isAuthenticated: true,
    })
    ;(useSubscription as jest.Mock).mockReturnValue({
      totalTokens: 200,
      tokenUsage: 50,
      subscriptionPlan: "PRO",
      isLoading: false,
    })

    render(<MainNavbar />)

    expect(screen.getByText("PRO")).toBeInTheDocument()
  })

  it("shows loading indicator when loading", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "1" },
      isAuthenticated: true,
    })

    // Mock setTimeout
    jest.useFakeTimers()

    render(<MainNavbar />)

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument()

    // Fast-forward time
    jest.advanceTimersByTime(2000)

    // Restore timers
    jest.useRealTimers()
  })

  it("opens search modal when search button is clicked", () => {
    render(<MainNavbar />)

    fireEvent.click(screen.getByTestId("search-button"))

    expect(screen.getByTestId("search-modal")).toBeInTheDocument()
  })

  it("shows notifications menu when session exists", () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    })

    render(<MainNavbar />)

    expect(screen.getByTestId("notifications-menu")).toBeInTheDocument()
  })

  it("highlights the active navigation item", () => {
    ;(usePathname as jest.Mock).mockReturnValue("/dashboard")

    render(<MainNavbar />)

    const navItems = screen.getAllByTestId(/^nav-item-/)
    const activeNavItem = navItems.find((item) => item.querySelector("div")?.classList.contains("text-primary"))

    expect(activeNavItem).toBeDefined()
  })
})
