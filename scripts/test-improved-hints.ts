import { generateContentAwareHints } from "../lib/utils/hint-system"

function print(title: string, obj: any) {
  console.log('--- ' + title + ' ---')
  console.log(JSON.stringify(obj, null, 2))
  console.log('')
}

const openaiQuestion = "What are the primary goals and objectives of Open AI, and how do they contribute to the field of artificial intelligence?"
const keywords = ['openai', 'artificial intelligence', 'goals', 'objectives', 'contributions']

console.log('=== CONTENT-AWARE HINT SYSTEM TEST ===')
console.log('Question:', openaiQuestion)
console.log('Keywords:', keywords)
console.log('')

console.log('--- OPENAI QUESTION HINTS ---')
const openaiHints = generateContentAwareHints(openaiQuestion, keywords, "long")
openaiHints.forEach((hint, index) => {
  console.log(`Hint ${index + 1}: ${hint.content}`)
  console.log(`Type: ${hint.type}, Penalty: ${hint.penalty}%, Target Length: ${hint.targetLength}`)
  console.log('')
})

console.log('--- COMPARISON: GENERIC VS CONTENT-AWARE ---')
const genericQuestion = "What is machine learning?"
const genericHints = generateContentAwareHints(genericQuestion, ['machine learning', 'algorithms', 'data'], "medium")
console.log('Generic ML Question Hints:')
genericHints.forEach((hint, index) => {
  console.log(`Hint ${index + 1}: ${hint.content.substring(0, 100)}...`)
})

console.log('')
console.log('Content-aware hints now provide specific, helpful guidance instead of generic structure tips!')