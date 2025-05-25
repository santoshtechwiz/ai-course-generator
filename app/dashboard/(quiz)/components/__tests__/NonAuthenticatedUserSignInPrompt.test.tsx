import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { signIn } from "next-auth/react"
import NonAuthenticatedUserSignInPrompt from "../NonAuthenticatedUserSignInPrompt"

// Mock next-auth signIn
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}))

// Mock useToast hook
jest.mock("@/hooks", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Update the framer-motion mock to properly handle motion-specific props
// Replace the existing mock with this improved version:

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }) => (
      <div
        data-testid="motion-div"
        data-motion-hover={whileHover ? "true" : "false"}
        data-motion-tap={whileTap ? "true" : "false"}
        {...props}
      >
        {children}
      </div>
    ),
  },
}))

describe("NonAuthenticatedUserSignInPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders with default props", () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" />)

    // Check if component renders with default title
    expect(screen.getByText("Multiple Choice Quiz Results")).toBeInTheDocument()

    // Check if default message is displayed
    expect(screen.getByText("Sign in to save your progress and access more features")).toBeInTheDocument()

    // Check if sign in button exists
    expect(screen.getByText("Sign in to Continue")).toBeInTheDocument()

    // Check if return button exists
    expect(screen.getByText("Return to Dashboard")).toBeInTheDocument()
  })

  it("calls onSignIn when sign-in button is clicked", async () => {
    const mockOnSignIn = jest.fn()
    render(<NonAuthenticatedUserSignInPrompt quizType="code" onSignIn={mockOnSignIn} />)

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign in to Continue")
    fireEvent.click(signInButton)

    // Check if the onSignIn callback was called
    expect(mockOnSignIn).toHaveBeenCalledTimes(1)
  })

  it("displays save message when showSaveMessage is true", () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" showSaveMessage={true} />)

    // Check if save message is displayed
    expect(screen.getByText(/Your progress isn't saved/)).toBeInTheDocument()
  })

  it("does not display save message when showSaveMessage is false", () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" showSaveMessage={false} />)

    // Check that save message is not displayed
    expect(screen.queryByText(/Your progress isn't saved/)).not.toBeInTheDocument()
  })

  it("displays custom message when provided", () => {
    const customMessage = "This is a custom message"
    render(<NonAuthenticatedUserSignInPrompt quizType="code" message={customMessage} />)

    // Check if custom message is displayed
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it("redirects to default route when onSignIn not provided", async () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="code" />)

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign in to Continue")
    fireEvent.click(signInButton)

    // Check if signIn from next-auth was called with expected parameters
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard/code",
      })
    })
  })

  it("shows quiz type specific title", () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="code" />)
    expect(screen.getByText("Code Quiz Results")).toBeInTheDocument()

    // Cleanup and render with different quiz type
    cleanup()
    render(<NonAuthenticatedUserSignInPrompt quizType="blanks" />)
    expect(screen.getByText("Fill in the Blanks Quiz Results")).toBeInTheDocument()
  })

  it("displays score preview when provided", () => {
    const previewData = {
      score: 8,
      maxScore: 10,
      percentage: 80,
    }

    render(<NonAuthenticatedUserSignInPrompt quizType="code" previewData={previewData} />)

    // Check if score percentage is displayed
    expect(screen.getByText("80%")).toBeInTheDocument()

    // Check if score details are displayed
    expect(screen.getByText("Your Score: 8 / 10")).toBeInTheDocument()

    // Check if feedback message is displayed
    expect(screen.getByText("Great job!")).toBeInTheDocument()
  })

  it("uses returnPath for custom callback when provided", async () => {
    const customReturnPath = "/custom/return/path"
    render(<NonAuthenticatedUserSignInPrompt quizType="code" returnPath={customReturnPath} />)

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign in to Continue")
    fireEvent.click(signInButton)

    // Check if signIn was called with the custom returnPath
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: customReturnPath,
      })
    })
  })

  it("displays score preview correctly when provided", () => {
    const previewData = {
      score: 8,
      maxScore: 10,
      percentage: 80,
    }

    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" previewData={previewData} />)

    // Check if score percentage is displayed
    expect(screen.getByText("80%")).toBeInTheDocument()

    // Check if score details are displayed
    expect(screen.getByText("Your Score: 8 / 10")).toBeInTheDocument()

    // Check if positive feedback is displayed for good score
    expect(screen.getByText("Great job!")).toBeInTheDocument()
  })

  it("displays appropriate feedback for low scores", () => {
    const lowScoreData = {
      score: 3,
      maxScore: 10,
      percentage: 30,
    }

    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" previewData={lowScoreData} />)

    // Check if score percentage is displayed
    expect(screen.getByText("30%")).toBeInTheDocument()

    // Check if score details are displayed
    expect(screen.getByText("Your Score: 3 / 10")).toBeInTheDocument()

    // Check if improvement feedback is displayed for low score
    expect(screen.getByText("Room for improvement")).toBeInTheDocument()
  })

  it("handles sign in button click with loading state", async () => {
    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" />)

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign in to Continue")
    fireEvent.click(signInButton)

    // Check if signIn from next-auth was called
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard/mcq",
      })
    })
  })

  it("renders with custom return path", () => {
    const customPath = "/custom/path"
    render(<NonAuthenticatedUserSignInPrompt quizType="mcq" returnPath={customPath} />)

    // Find and click the sign in button
    const signInButton = screen.getByText("Sign in to Continue")
    fireEvent.click(signInButton)

    // Check if signIn was called with the custom path
    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: customPath,
    })
  })
})
