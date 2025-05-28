import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import configureStore from "redux-mock-store"
import McqQuiz from "../McqQuiz"

const mockStore = configureStore([])

// Add router mock if needed (for future-proofing)
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe("McqQuiz", () => {
  const question = {
    id: "q1",
    text: "What is 2+2?",
    options: [{ id: "a", text: "4" }, { id: "b", text: "5" }],
  }

  let store: any

  beforeEach(() => {
    store = mockStore({
      quiz: {
        answers: {},
      },
    })
  })

  it("renders question and options", () => {
    render(
      <Provider store={store}>
        <McqQuiz question={question} onAnswer={jest.fn()} />
      </Provider>
    )
    expect(screen.getByText(/What is 2\+2/i)).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("allows selecting and saving an answer", () => {
    render(
      <Provider store={store}>
        <McqQuiz question={question} onAnswer={jest.fn()} />
      </Provider>
    )
    // Click the first "4" option (avoid ambiguity)
    fireEvent.click(screen.getAllByText("4")[0])
    fireEvent.click(screen.getByText(/Save Answer/i))
    expect(screen.getByText(/Answer saved!/i)).toBeInTheDocument()
  })

  it("shows 'Question Unavailable' if question is missing", () => {
    render(
      <Provider store={store}>
        <McqQuiz question={null as any} onAnswer={jest.fn()} />
      </Provider>
    )
    expect(screen.getByText(/Question Unavailable/i)).toBeInTheDocument()
  })
})
