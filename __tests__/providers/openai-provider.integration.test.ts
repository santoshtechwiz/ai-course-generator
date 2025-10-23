import { describe, it, expect } from "vitest";
import { OpenAIProvider } from "@/lib/ai/providers/openai-provider";
import dotenv from "dotenv";
dotenv.config();

describe("OpenAIProvider (real integration test)", () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const provider = new OpenAIProvider(apiKey);

  it(
    "should generate real MCQ quiz questions from OpenAI",
    async () => {
      const quiz = await provider.generateMCQQuiz({
        title: "JavaScript basics",
        amount: 2,
        difficulty: "easy",
        userType: "FREE",
      });

      expect(Array.isArray(quiz)).toBe(true);
      expect(quiz.length).toBeGreaterThan(0);
      const first = quiz[0];
      expect(first).toHaveProperty("question");
      expect(first).toHaveProperty("answer");
      expect(first).toHaveProperty("option1");
      expect(first).toHaveProperty("option2");
      expect(first).toHaveProperty("option3");

      console.log("✅ Sample MCQ:", first);
    },
    60000 // timeout
  );
  it(
    "should generate a real coding quiz with open-ended questions",
    async () => {
      const quiz = await provider.generateOpenEndedQuiz({
        title: "JavaScript Functions and Closures",
        amount: 2,
        difficulty: "medium",
        userType: "FREE",
      });

      // Verify quiz structure
      expect(quiz).toBeDefined();
      expect(quiz.title).toBeTypeOf("string");
      expect(Array.isArray(quiz.questions)).toBe(true);
      expect(quiz.questions.length).toBeGreaterThan(0);

      const first = quiz.questions[0];
      expect(first).toHaveProperty("question");
      expect(first).toHaveProperty("answer");
      expect(first).toHaveProperty("hints");
      expect(first).toHaveProperty("difficulty");
      expect(first).toHaveProperty("tags");

      // Sanity checks
      expect(first.question.length).toBeGreaterThan(30);
      expect(first.answer.length).toBeGreaterThan(50);

      console.log("✅ Sample Code Quiz Question:");
      console.log(JSON.stringify(first, null, 2));
    },
    90000 // 90s timeout since real API call
  );

  it(
    "should generate real coding MCQ questions from OpenAI",
    async () => {
      const questions = await provider.generateCodingMCQs(
        "JavaScript",
        "Array Methods",
        "medium",
        2
      );

      // Verify structure
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(2);

      const first = questions[0];
      expect(first).toHaveProperty("question");
      expect(first).toHaveProperty("options");
      expect(first).toHaveProperty("correctAnswer");
      expect(first).toHaveProperty("questionType");
      expect(first).toHaveProperty("language");

      // Verify specific properties
      expect(typeof first.question).toBe("string");
      expect(first.question.length).toBeGreaterThan(0);
      expect(Array.isArray(first.options)).toBe(true);
      expect(first.options.length).toBe(4);
      expect(typeof first.correctAnswer).toBe("string");
      expect(first.language).toBe("JavaScript");
      expect(["standard", "fill-in-the-blank"]).toContain(first.questionType);

      // Verify correctAnswer is one of the options
      expect(first.options).toContain(first.correctAnswer);

      console.log("✅ Sample Coding MCQ:", JSON.stringify(first, null, 2));
    },
    90000 // 90s timeout
  );

  it(
    "should handle different programming languages",
    async () => {
      const languages = ["Python", "Java", "TypeScript"];
      
      for (const lang of languages) {
        const questions = await provider.generateCodingMCQs(
          lang,
          "Basic Syntax",
          "easy",
          1
        );

        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBe(1);
        expect(questions[0].language).toBe(lang);
        console.log(`✅ Generated ${lang} question successfully`);
      }
    },
    120000 // 120s timeout for multiple languages
  );

  it(
    "should handle different difficulty levels",
    async () => {
      const difficulties = ["easy", "medium", "hard"];
      
      for (const difficulty of difficulties) {
        const questions = await provider.generateCodingMCQs(
          "JavaScript",
          "Functions",
          difficulty,
          1
        );

        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBe(1);
        console.log(`✅ Generated ${difficulty} difficulty question successfully`);
      }
    },
    120000 // 120s timeout
  );

  it(
    "should generate questions with proper code snippet handling",
    async () => {
      const questions = await provider.generateCodingMCQs(
        "JavaScript",
        "Loops and Conditions",
        "medium",
        3
      );

      expect(questions.length).toBe(3);

      // Check variety of question types
      const questionTypes = new Set(questions.map((q) => q.questionType));
      console.log(`Generated question types: ${Array.from(questionTypes).join(", ")}`);

      // Verify at least some questions have code snippets
      const withCodeSnippet = questions.filter((q) => q.codeSnippet !== null);
      expect(withCodeSnippet.length).toBeGreaterThan(0);

      // Verify correctAnswer is always one of the options
      questions.forEach((q) => {
        expect(q.options).toContain(q.correctAnswer);
      });

      console.log("✅ Code snippet handling verified");
    },
    90000
  );

  it(
    "should validate generated questions have all required fields",
    async () => {
      const questions = await provider.generateCodingMCQs(
        "Python",
        "Data Types",
        "easy",
        2
      );

      expect(questions.length).toBeGreaterThan(0);

      // Validate each question
      questions.forEach((question, index) => {
        expect(question.question).toBeDefined();
        expect(typeof question.question).toBe("string");
        expect(question.question.length).toBeGreaterThan(5);

        expect(question.options).toBeDefined();
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.length).toBe(4);

        expect(question.correctAnswer).toBeDefined();
        expect(typeof question.correctAnswer).toBe("string");

        expect(question.questionType).toBeDefined();
        expect(["standard", "fill-in-the-blank"]).toContain(question.questionType);

        expect(question.language).toBe("Python");

        console.log(`✅ Question ${index + 1} validation passed`);
      });
    },
    90000
  );
});


