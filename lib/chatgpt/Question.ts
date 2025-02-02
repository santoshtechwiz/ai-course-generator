export interface Question {
  question: string;
  answer: string;
  options?: string[]; // Only present for MCQs
}
