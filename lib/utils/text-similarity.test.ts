
import { isAnswerCloseEnough } from "./text-similarity";

describe("isAnswerCloseEnough", () => {
    it("should return false if either input is empty", () => {
        expect(isAnswerCloseEnough("", "correct answer")).toBe(false);
        expect(isAnswerCloseEnough("user input", "")).toBe(false);
        expect(isAnswerCloseEnough("", "")).toBe(false);
    });

    it("should return true if similarity score meets or exceeds the threshold", () => {
        expect(isAnswerCloseEnough("hello", "hello", 80)).toBe(true); // Exact match
        expect(isAnswerCloseEnough("helo", "hello", 80)).toBe(true); // Close match
    });

    it("should return false if similarity score is below the threshold", () => {
        expect(isAnswerCloseEnough("world", "hello", 80)).toBe(false); // Dissimilar
        expect(isAnswerCloseEnough("helo", "hello", 90)).toBe(false); // Below threshold
    });

    it("should handle custom thresholds correctly", () => {
        expect(isAnswerCloseEnough("helo", "hello", 70)).toBe(true); // Lower threshold
        expect(isAnswerCloseEnough("helo", "hello", 90)).toBe(false); // Higher threshold
    });

    it("should handle edge cases with special characters and whitespace", () => {
        expect(isAnswerCloseEnough(" hello ", "hello", 80)).toBe(true); // Extra whitespace
        expect(isAnswerCloseEnough("hello!", "hello", 80)).toBe(true); // Punctuation
    });
});