import { OpenEndedQuizService } from "@/app/services/openended-quiz.service";
import { BlanksQuizService } from "@/app/services/blanks-quiz.service";
import { McqQuizService } from "@/app/services/mcq-quiz.service";

describe("McqQuizService", () => {
  const service = new McqQuizService();

  it("should format MCQ questions correctly", () => {
    const questions = [
      { id: 1, question: "Q1", options: JSON.stringify(["A", "B", "C"]), answer: "A" },
    ];
    const formatted = service["formatQuestions"](questions);
    expect(formatted[0]).toEqual({
      id: 1,
      question: "Q1",
      options: ["A", "B", "C"],
      correctAnswer: "A",
      type: "mcq",
    });
  });
});

describe("BlanksQuizService", () => {
  const service = new BlanksQuizService();

  it("should format blanks questions correctly", () => {
    const questions = [
      { id: 2, question: "Fill ___", answer: "gap" },
    ];
    const formatted = service["formatQuestions"](questions);
    expect(formatted[0]).toEqual({
      id: 2,
      question: "Fill ___",
      answer: "gap",
      type: "blanks",
    });
  });
});

describe("OpenEndedQuizService", () => {
  const service = new OpenEndedQuizService();

  it("should format openended questions correctly", () => {
    const questions = [
      { id: 3, question: "Explain?", answer: "Because", openEndedQuestion: { hints: "hint1|hint2", difficulty: "easy", tags: "tag1|tag2" } },
    ];
    const formatted = service["formatQuestions"](questions);
    expect(formatted[0]).toEqual({
      id: 3,
      question: "Explain?",
      answer: "Because",
      hints: ["hint1", "hint2"],
      difficulty: "easy",
      tags: ["tag1", "tag2"],
      type: "openended",
    });
  });
});
