# Coding MCQ Generation Improvements

## Summary
Improved the `generateCodingMCQs` function in `openai-provider.ts` to generate high-quality, difficulty-appropriate coding questions aligned with other quiz generation functions in the platform.

## Key Changes

### 1. **Model Selection Alignment** ✅
- **Before**: Used hardcoded model `"gpt-4-1106-preview"`
- **After**: Uses `getAIModel(userType)` method to dynamically select appropriate model based on user tier
- **Benefit**: Consistent with other quiz generation functions; respects user subscription levels

### 2. **Enhanced Prompt Engineering** 🎯

#### Difficulty-Specific Guidance
Added comprehensive difficulty level specifications:

**EASY Level:**
- Focus: Basic syntax and fundamental concepts
- Examples: Simple loops, conditionals, basic data structures
- Code Complexity: 5-10 lines of straightforward code
- Question Style: Clear syntax without tricks, obvious incorrect options

**MEDIUM Level:**
- Focus: Intermediate concepts requiring understanding of multiple features
- Examples: Array/object manipulation, closures, promises, async/await
- Code Complexity: 10-20 lines with moderate complexity
- Question Style: Combines multiple concepts, tests common patterns

**HARD Level:**
- Focus: Advanced topics requiring deep understanding
- Examples: Complex algorithms, design patterns, performance optimization
- Code Complexity: 15-30 lines with sophisticated logic
- Question Style: Edge cases, subtle behaviors, expert-level analysis

#### Improved Question Quality Requirements

1. **Standard Questions (70%)**
   - Clear, specific questions about code behavior
   - Well-formatted, runnable code snippets
   - Four distinct, realistic options
   - Proper output/behavior prediction

2. **Fill-in-the-Blank Questions (20%)**
   - Code with blank marked as `____` or `/* blank */`
   - Four syntactically valid options (3 incorrect but plausible)
   - Tests specific syntax knowledge

3. **Concept Questions (10%)**
   - No code snippet (codeSnippet: null)
   - Tests theoretical understanding
   - Four distinct conceptual answers

### 3. **Enhanced System Prompt** 🤖
- **Before**: Generic assistant that generates coding questions
- **After**: Expert programming instructor with specific expertise
- Emphasizes:
  - Understanding difficulty levels
  - Creating realistic, practical scenarios
  - Clear, unambiguous questions
  - Real-world coding patterns

### 4. **Function Signature Update** 📝
```typescript
// Before
async generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount: number
): Promise<CodeChallenge[]>

// After
async generateCodingMCQs(
  language: string,
  title: string,
  difficulty: string,
  amount: number,
  userType: string = "FREE"  // Added with default
): Promise<CodeChallenge[]>
```

### 5. **Comprehensive Testing** ✅

Created `__tests__/providers/prompt.test.ts` with:

- **Test 1**: EASY level questions validation
  - Verifies basic concepts
  - Checks code simplicity (≤15 lines)
  - Validates structure and types

- **Test 2**: MEDIUM level questions validation
  - Ensures intermediate complexity
  - Verifies substantial code (>50 chars)
  - Tests multiple concept integration

- **Test 3**: HARD level questions validation
  - Checks advanced topics
  - Validates detailed questions (>20 chars)
  - Tests deep understanding requirements

- **Test 4**: Question type distribution
  - Validates 70/20/10 distribution
  - Verifies fill-in-blank markers
  - Checks question variety

- **Test 5**: Multi-language support
  - Tests Python, Java, TypeScript
  - Validates language-specific generation
  - Ensures consistency across languages

## Benefits 🚀

1. **Consistency**: Aligned with other quiz generation functions (MCQ, OpenEnded, FillInTheBlanks)
2. **Quality**: Better prompts generate more realistic, difficulty-appropriate questions
3. **Flexibility**: Dynamic model selection based on user type
4. **Testability**: Comprehensive test suite validates functionality
5. **Maintainability**: Clear prompt structure makes future improvements easier

## Backward Compatibility ✅

- The `userType` parameter has a default value of `"FREE"`
- Existing code calling `generateCodingMCQs` without the parameter continues to work
- No breaking changes to service layer or API

## Example Generated Questions

### Easy Level
```javascript
// Question: What will this code print?
const arr = [1, 2, 3];
console.log(arr.length);

// Options: "3", "undefined", "2", "1"
// Answer: "3"
```

### Medium Level
```javascript
// Question: What happens when this async function encounters an error?
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// Options involve error handling, promise rejection, exception behavior
```

### Hard Level
```javascript
// Question: What is the memory behavior of this recursive implementation?
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

// Options analyze time/space complexity, memoization effects
```

## Next Steps

1. ✅ Function improved with better prompts
2. ✅ Tests created and validated
3. 🔄 Monitor question quality in production
4. 🔄 Gather user feedback on question difficulty accuracy
5. 🔄 Fine-tune difficulty thresholds based on data

## Files Modified

1. `lib/ai/providers/openai-provider.ts` - Main function improvements
2. `__tests__/providers/prompt.test.ts` - Comprehensive test suite

## Testing

Run tests with:
```bash
npm run test __tests__/providers/prompt.test.ts
```

Note: Tests require `OPENAI_API_KEY` environment variable.
