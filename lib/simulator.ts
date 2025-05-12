import type { Question } from "@/app/types/types"

function generateMCQ(amount: number): Promise<{ questions: Question[] }> {
  const questions: Question[] = []
  for (let i = 0; i < amount; i++) {
    questions.push({
      id: i + 1,
      question: `What is ${i + 1} + ${i + 2}?`,
      answer: `${i + 1 + i + 2}`,
      option1: `${i + 1}`,
      option2: `${i + 2}`,
      option3: `${i + 3}`,
    })
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ questions })
    }, 10000)
  })
}
