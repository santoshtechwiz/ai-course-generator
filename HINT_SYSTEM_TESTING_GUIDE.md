# 🧪 Adaptive Hint System — Testing Guide

## Quick Test Scenarios

### Scenario 1: Singleton Design Pattern

**Question:**  
> What is the Singleton design pattern used for?

**Correct Answer:**  
> It ensures only one instance of a class is created and used throughout the application.

**Test Data:**
```typescript
const question = {
  id: "test-1",
  text: "What is the Singleton design pattern used for?",
  answer: "It ensures only one instance of a class is created and used throughout the application.",
  tags: ["design pattern", "object creation", "instance control"],
  keywords: ["single", "instance", "shared resource"],
  blanks: ["It ensures only ___ instance of a class."]
}
```

**Expected Hint Flow:**

1. **💡 Concept Clue** (Revealed immediately)
   - Content: "Think about these concepts: **design pattern, object creation, instance control**. How do they relate to the question?"
   - Color: Blue
   - Label: "High-level topic direction"

2. **🔑 Keyword Clue** (Revealed after Hint 1)
   - Content: "Key terms to include: **single, instance, shared resource**. Try incorporating these specific words in your answer."
   - Color: Amber
   - Label: "Specific terms to focus on"

3. **📝 Structure Clue** (Revealed after Hint 2)
   - Content: "Fill in the blanks: \"It ensures only ___ instance of a class.\""
   - Color: Emerald
   - Label: "Fill-in-the-gap guidance"

**Adaptive Behavior Test:**

| User Answer | Similarity | Expected Hint | Reason |
|-------------|------------|---------------|--------|
| "manages memory" | < 30% | Concept Clue (💡) | Far from correct |
| "creates single objects" | ~45% | Keyword Clue (🔑) | Getting closer |
| "ensures one instance of class" | ~75% | Structure Clue (📝) | Very close |
| "ensures only one instance..." | > 80% | No hint needed | Answer acceptable |

---

### Scenario 2: React useState Hook

**Question:**  
> What does the useState hook return?

**Correct Answer:**  
> An array with two elements: the current state value and a function to update it.

**Test Data:**
```typescript
const question = {
  id: "test-2",
  text: "What does the useState hook return?",
  answer: "An array with two elements: the current state value and a function to update it.",
  tags: ["React", "hooks", "state management"],
  keywords: ["array", "state value", "update function"],
  blanks: ["An array with ___ and ___"]
}
```

**Expected Hints:**

1. **💡 Concept:** "Think about: React, hooks, state management..."
2. **🔑 Keyword:** "Key terms: array, state value, update function..."
3. **📝 Structure:** "Fill in: An array with ___ and ___"

---

### Scenario 3: Fallback (No Metadata)

**Question:**  
> Explain polymorphism in object-oriented programming.

**Test Data:**
```typescript
const question = {
  id: "test-3",
  text: "Explain polymorphism in object-oriented programming.",
  answer: "Polymorphism allows objects of different classes to be treated as objects of a common parent class.",
  // NO tags, keywords, or blanks
}
```

**Expected Behavior:**
- System falls back to generated hints:
  1. Concept from question analysis
  2. Keywords extracted from answer
  3. Structure based on answer pattern

---

## Visual Testing Checklist

### Hint Card Display
- [ ] Blue card for Concept (index 0)
- [ ] Amber card for Keyword (index 1)
- [ ] Emerald card for Structure (index 2)
- [ ] Icons display correctly (💡/🔑/📝)
- [ ] Badge shows: "CONCEPT" / "KEYWORD" / "STRUCTURE"
- [ ] Italic description text below hint

### Positive Reinforcement
- [ ] Blue gradient box shows below hints
- [ ] Lightbulb icon visible
- [ ] Status badge: "🌱 Ready to learn" → "⭐ Learning in progress" → "🏁 All hints revealed"
- [ ] Encouragement message updates per hint:
  - Hint 1: "Good start! This concept clue..."
  - Hint 2: "Nice! The keyword clue..."
  - Hint 3: "Almost there! Use the structure clue..."

### Button States
- [ ] "Reveal Next Hint (1/3)" updates correctly
- [ ] Button disabled when all hints revealed
- [ ] No penalty messaging visible
- [ ] No negative language ("lose points", "-15%", etc.)

---

## Browser Console Testing

### Test 1: Generate Contextual Hints
```javascript
import { generateContextualHints } from '@/lib/utils/hint-generation-contextual'

const hints = generateContextualHints(
  "It ensures only one instance of a class is created.",
  "What is the Singleton design pattern used for?",
  {
    tags: ["design pattern", "object creation"],
    keywords: ["single", "instance"],
    blanks: ["It ensures only ___ instance"]
  }
)

console.log('Generated hints:', hints)
// Expected: 3 hints (Concept, Keyword, Structure)
```

### Test 2: Adaptive Hint Selection
```javascript
import { selectAdaptiveContextualHint } from '@/lib/utils/hint-generation-contextual'
import { calculateAnswerSimilarity } from '@/lib/utils/text-similarity'

const userAnswer = "creates one object"
const correctAnswer = "ensures only one instance of a class"

const result = calculateAnswerSimilarity(userAnswer, correctAnswer)
console.log('Similarity:', result.similarity) // Should be < 0.6

const selected = selectAdaptiveContextualHint(
  userAnswer,
  correctAnswer,
  hints,
  0
)

console.log('Selected hint:', selected)
// Expected: Keyword hint (index 1) because similarity is medium
```

---

## Integration Testing

### Test in BlanksQuiz Component

```tsx
// components/quiz/BlanksQuiz.tsx or similar

const hints = useMemo(() => {
  return generateContextualHints(
    questionData.answer,
    questionData.text,
    {
      tags: questionData.tags || [],
      keywords: questionData.keywords || [],
      blanks: questionData.blanks || []
    },
    userAnswer // For adaptive selection
  )
}, [questionData, userAnswer])

return (
  <div>
    {/* Other quiz UI */}
    
    <HintSystem
      hints={[]} // Leave empty to use contextual hints
      correctAnswer={questionData.answer}
      questionText={questionData.text}
      userInput={userAnswer}
      tags={questionData.tags}
      keywords={questionData.keywords}
      blanks={questionData.blanks}
      maxHints={3}
      onHintUsed={(index, hint) => {
        console.log('Hint revealed:', hint.description)
        // Track analytics if needed
      }}
    />
  </div>
)
```

---

## Regression Testing

### Ensure No Breaking Changes

1. **Existing Hint Arrays Still Work**
   ```tsx
   <HintSystem
     hints={[
       { level: "low", type: "contextual", content: "Old hint 1", ... },
       { level: "medium", type: "semantic", content: "Old hint 2", ... }
     ]}
     // ... other props
   />
   ```
   Expected: Displays old hints without errors

2. **Fallback Works Without Metadata**
   ```tsx
   <HintSystem
     correctAnswer="Answer here"
     questionText="Question here"
     // NO tags, keywords, or blanks
   />
   ```
   Expected: Generates basic hints, no crashes

3. **Auth Gating Still Works**
   - Guest users: See first hint only
   - Authenticated without sub: See first 2 hints
   - Authenticated with sub: See all hints
   Expected: Upgrade prompts show correctly

---

## Performance Testing

### Hint Generation Speed
```javascript
console.time('generateContextualHints')
const hints = generateContextualHints(answer, question, metadata)
console.timeEnd('generateContextualHints')
// Expected: < 5ms
```

### Similarity Calculation Speed
```javascript
console.time('calculateAnswerSimilarity')
const result = calculateAnswerSimilarity(userAnswer, correctAnswer)
console.timeEnd('calculateAnswerSimilarity')
// Expected: < 10ms
```

---

## Accessibility Testing

- [ ] Hint cards keyboard navigable
- [ ] Screen reader announces hint content
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Icons have descriptive labels
- [ ] Focus indicators visible

---

## Mobile Testing

- [ ] Hint cards responsive on small screens
- [ ] Icons and badges readable on mobile
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scroll
- [ ] Encouragement text wraps correctly

---

## Success Criteria

✅ All hints display with correct icons and colors  
✅ Adaptive selection works based on similarity  
✅ Positive reinforcement messages appear  
✅ No penalty/negative messaging visible  
✅ Fallback works without metadata  
✅ No breaking changes to existing code  
✅ Performance under 10ms per operation  

---

## Bug Report Template

If you find issues, report using this format:

**Bug:** [Brief description]  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]  
**Actual:** [What actually happens]  
**Browser:** [Chrome/Firefox/Safari]  
**Screenshot:** [If applicable]

---

**Happy Testing! 🚀**
