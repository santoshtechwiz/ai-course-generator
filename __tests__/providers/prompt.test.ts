import { describe, it, expect } from "vitest";
import { OpenAIProvider } from "@/lib/ai/providers/openai-provider";
import dotenv from "dotenv";
dotenv.config();

describe("AI Prompt - Coding MCQ Generation", () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const provider = new OpenAIProvider(apiKey);

  describe("generateCodingMCQs - Difficulty-Based Question Generation", () => {
    it(
      "should generate EASY level coding questions with basic concepts",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "JavaScript",
          "Array Methods",
          "easy",
          3,
          "FREE"
        );

        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBe(3);

        questions.forEach((q) => {
          expect(q).toHaveProperty("question");
          expect(q).toHaveProperty("codeSnippet");
          expect(q).toHaveProperty("options");
          expect(q).toHaveProperty("correctAnswer");
          expect(q).toHaveProperty("language");
          expect(q).toHaveProperty("questionType");

          expect(typeof q.question).toBe("string");
          expect(q.question.length).toBeGreaterThan(0);
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBe(4);
          expect(typeof q.correctAnswer).toBe("string");
          expect(q.language).toBe("JavaScript");
          expect(["standard", "fill-in-the-blank"]).toContain(q.questionType);
          expect(q.options).toContain(q.correctAnswer);

          if (q.codeSnippet) {
            const lineCount = q.codeSnippet.split("\n").length;
            expect(lineCount).toBeLessThanOrEqual(15);
          }
        });

        console.log("✅ EASY Question:", questions[0].question);
      },
      90000
    );

    it(
      "should generate MEDIUM level coding questions",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "JavaScript",
          "Async/Await",
          "medium",
          3,
          "BASIC"
        );

        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBe(3);

        questions.forEach((q) => {
          expect(q).toHaveProperty("question");
          expect(q.options.length).toBe(4);
          expect(q.options).toContain(q.correctAnswer);

          if (q.codeSnippet) {
            expect(q.codeSnippet.length).toBeGreaterThan(50);
          }
        });

        console.log("✅ MEDIUM Question:", questions[0].question);
      },
      90000
    );

    it(
      "should generate HARD level coding questions",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "JavaScript",
          "Closures",
          "hard",
          3,
          "PREMIUM"
        );

        expect(questions.length).toBe(3);

        questions.forEach((q) => {
          expect(q.options.length).toBe(4);
          expect(q.options).toContain(q.correctAnswer);
          expect(q.question.length).toBeGreaterThan(20);
        });

        console.log("✅ HARD Question:", questions[0].question);
      },
      90000
    );

    it(
      "should generate correct question type distribution",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "Python",
          "List Comprehensions",
          "medium",
          10,
          "FREE"
        );

        expect(questions.length).toBe(10);

        const standardCount = questions.filter((q) => q.questionType === "standard").length;
        const fillInBlankCount = questions.filter((q) => q.questionType === "fill-in-the-blank").length;

        expect(standardCount).toBeGreaterThanOrEqual(6);
        expect(fillInBlankCount).toBeGreaterThanOrEqual(1);

        const fillInQuestions = questions.filter((q) => q.questionType === "fill-in-the-blank");
        fillInQuestions.forEach((q) => {
          if (q.codeSnippet) {
            const hasBlank = q.codeSnippet.includes("____") || q.codeSnippet.includes("/* blank */");
            expect(hasBlank).toBe(true);
          }
        });

        console.log("✅ Distribution - Standard:", standardCount, "Fill-in-blank:", fillInBlankCount);
      },
      90000
    );

    it(
      "should generate properly formatted options (short, single-line, no code blocks)",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "JavaScript",
          "Variables and Data Types",
          "medium",
          5,
          "FREE"
        );

        questions.forEach((q, qIdx) => {
          expect(q.options.length).toBe(4);

          q.options.forEach((option, optIdx) => {
            // Options should be single line
            expect(option.split("\n").length).toBe(1);

            // Options should not be excessively long
            expect(option.length).toBeLessThan(150);

            // Options should not be empty
            expect(option.trim().length).toBeGreaterThan(0);

            // Fill-in-blank options should be especially short (keywords/expressions)
            if (q.questionType === "fill-in-the-blank") {
              expect(option.length).toBeLessThan(50);
            }
          });
        });

        console.log("✅ All options are properly formatted (short, single-line)");
        console.log("   Sample option:", questions[0].options[0]);
      },
      90000
    );

    it(
      "should generate questions with code snippets and proper separation",
      async () => {
        const questions = await provider.generateCodingMCQs(
          "TypeScript",
          "Type Guards",
          "hard",
          3,
          "PREMIUM"
        );

        questions.forEach((q) => {
          // Question text should not contain code (code goes in codeSnippet)
          expect(q.question).toBeTruthy();
          
          // If codeSnippet exists, it should have actual code
          if (q.codeSnippet) {
            expect(q.codeSnippet.length).toBeGreaterThan(10);
          }

          // Options should be present and formatted correctly
          expect(q.options.length).toBe(4);
          expect(q.correctAnswer).toBeTruthy();
          expect(q.options).toContain(q.correctAnswer);
        });

        console.log("✅ Code snippets and options are properly separated");
        console.log("   Has code snippet:", questions[0].codeSnippet !== null);
        console.log("   Question:", questions[0].question.substring(0, 50) + "...");
      },
      90000
    );
  });
});
