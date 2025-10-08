# PlanAwareButton Unified Styling Guide

**Date**: October 8, 2025  
**Status**: ✅ COMPLETE  
**Purpose**: Ensure consistent UX across all quiz creation forms

---

## 🎯 Unified Standards

All quiz creation forms now use **identical PlanAwareButton styling** for consistency:

### Visual Design
```tsx
className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
```

### Standard Properties
| Property | Value | Purpose |
|----------|-------|---------|
| **Gradient** | `from-blue-600 to-indigo-600` | Consistent brand blue-indigo theme |
| **Hover** | `hover:from-blue-700 hover:to-indigo-700` | Darker on hover for feedback |
| **Height** | `h-14` | Large tap target (56px) |
| **Font** | `text-lg font-semibold` | Readable, prominent |
| **Shadow** | `shadow-lg hover:shadow-xl` | Depth and interactivity |
| **Disabled** | `disabled:from-sky-300 disabled:to-cyan-300` | Light blue indicates unavailable |
| **Text** | `text-white` | High contrast on gradient |

### Standard Messages
```tsx
customStates={{
  default: {
    tooltip: "Click to generate your quiz",
  },
  notEnabled: {
    label: "Complete form to generate",
    tooltip: "Please complete the form before generating the quiz",
  },
  noCredits: {
    label: "Out of credits",
    tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
  },
}}
```

### Standard Loading Label
```tsx
loadingLabel="Generating Quiz..."
```
*(Exception: FlashCards uses "Generating Flashcards..." for specificity)*

---

## ✅ Forms Updated

### 1. MCQ Quiz (`CreateQuizForm.tsx`)
- **Line**: ~480
- **Changes**: 
  - Changed gradient from `indigo-purple` to `blue-indigo`
  - Standardized message: "Enter a topic" → "Complete form to generate"
  - Removed custom shadow color (`hover:shadow-indigo-500/25`)
- **Status**: ✅ COMPLETE

### 2. Open-Ended Quiz (`OpenEndedQuizForm.tsx`)
- **Line**: ~433
- **Changes**:
  - Updated height from `h-12 md:h-14` to `h-14`
  - Updated font from `text-sm md:text-base` to `text-lg`
  - Standardized message: "Enter a title" → "Complete form to generate"
  - Simplified credit message: `Need credits (X remaining)` → "Out of credits"
  - Updated loading label case: "Generating quiz..." → "Generating Quiz..."
- **Status**: ✅ COMPLETE

### 3. Blanks Quiz (`BlankQuizForm.tsx`)
- **Line**: ~467
- **Changes**:
  - Added gradient (was using default theme)
  - Updated height from `h-12 lg:h-14` to `h-14`
  - Updated font from `text-base lg:text-lg` to `text-lg`
  - Added explicit disabled gradient styling
  - Removed focus ring (handled by PlanAwareButton internally)
- **Status**: ✅ COMPLETE

### 4. Code Quiz (`CodeQuizForm.tsx`)
- **Line**: ~774
- **Changes**:
  - Updated loading label: "Generating Code Quiz..." → "Generating Quiz..."
  - Standardized message: "Enter a topic" → "Complete form to generate"
  - Removed custom shadow color (`hover:shadow-blue-500/25`)
  - Removed focus ring styles (redundant)
- **Status**: ✅ COMPLETE

### 5. Document/PDF Quiz (`document/page.tsx`)
- **Line**: ~571
- **Changes**:
  - Changed from theme-based gradient (`from-primary to-primary/80`) to blue-indigo
  - Updated font from `text-base` to `text-lg`
  - Standardized message: "Upload a document first" → "Complete form to generate"
  - Simplified credit message: "Out of credits - Upgrade needed" → "Out of credits"
  - Added explicit disabled gradient styling
- **Status**: ✅ COMPLETE

### 6. Flashcards (`FlashCardCreate.tsx`)
- **Line**: ~495
- **Changes**:
  - Added gradient (was using default theme)
  - Added full transition and shadow styles
  - Standardized tooltip: "Click to generate your flashcards" → "Click to generate your quiz"
  - Simplified credit message: "Insufficient Credits" → "Out of credits"
  - Updated loading label: "Creating Flashcards..." → "Generating Flashcards..." (kept specific)
  - Added explicit disabled gradient styling
- **Status**: ✅ COMPLETE

---

## 🎨 Design Rationale

### Why Blue-Indigo Gradient?
- **Most Common**: 3 out of 6 forms already used this
- **Brand Consistency**: Matches primary action colors across platform
- **Accessibility**: High contrast with white text
- **Modern**: Gradient conveys interactivity and premium feel

### Why h-14 (56px)?
- **Mobile-Friendly**: Large enough for comfortable taps
- **WCAG Compliant**: Meets touch target size guidelines
- **Desktop UX**: Prominent call-to-action without being overwhelming

### Why "Complete form to generate"?
- **Generic**: Works for all form types (topic, title, upload)
- **Actionable**: Tells users what to do
- **Consistent**: Same message = predictable UX

### Why Simplified Credit Messages?
- **Clarity**: "Out of credits" is direct and clear
- **Consistency**: Same wording across all forms
- **CTA**: Tooltip suggests upgrade path

---

## 🔧 Implementation Pattern

Use this pattern for **all future quiz creation forms**:

```tsx
<PlanAwareButton
  label="Generate Quiz"
  onClick={handleSubmit(onSubmit)}
  isLoggedIn={isLoggedIn}
  isEnabled={!isDisabled}
  isLoading={isLoading}
  loadingLabel="Generating Quiz..."
  className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
  customStates={{
    default: {
      tooltip: "Click to generate your quiz",
    },
    notEnabled: {
      label: "Complete form to generate",
      tooltip: "Please complete the form before generating the quiz",
    },
    noCredits: {
      label: "Out of credits",
      tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
    },
  }}
/>
```

---

## 🧪 Testing Checklist

### Visual Consistency
- [ ] All buttons have blue-indigo gradient
- [ ] All buttons are h-14 (56px height)
- [ ] All buttons use text-lg font
- [ ] All buttons have shadow-lg and hover:shadow-xl
- [ ] Disabled state shows light blue gradient

### Interactive States
- [ ] Hover darkens gradient (blue-600 → blue-700, indigo-600 → indigo-700)
- [ ] Loading shows spinner with "Generating Quiz..." label
- [ ] Disabled state has light blue gradient and "not-allowed" cursor
- [ ] Tooltips show on hover for each state

### Messaging
- [ ] Default tooltip: "Click to generate your quiz"
- [ ] Not enabled label: "Complete form to generate"
- [ ] No credits label: "Out of credits"
- [ ] Consistent wording across all 6 forms

### Responsive
- [ ] Button maintains h-14 on all screen sizes
- [ ] Text stays readable on mobile
- [ ] Gradient renders correctly in light/dark mode

---

## 📊 Before & After Comparison

| Form | Before Gradient | After Gradient | Before Height | After Height | Before Font | After Font |
|------|----------------|----------------|---------------|--------------|-------------|------------|
| MCQ | indigo-purple | **blue-indigo** | h-14 | h-14 | text-lg | text-lg |
| OpenEnded | blue-indigo | blue-indigo | h-12 md:h-14 | **h-14** | text-sm md:text-base | **text-lg** |
| Blanks | ❌ default | **blue-indigo** | h-12 lg:h-14 | **h-14** | text-base lg:text-lg | **text-lg** |
| Code | blue-indigo | blue-indigo | h-14 | h-14 | text-lg | text-lg |
| Document | primary-based | **blue-indigo** | h-14 | h-14 | text-base | **text-lg** |
| FlashCard | ❌ default | **blue-indigo** | h-14 | h-14 | text-lg | text-lg |

---

## 🔗 Related Files

### Component
- `components/quiz/PlanAwareButton.tsx` - Core button component with auth/plan/credit logic

### Forms Using PlanAwareButton
1. `app/dashboard/(quiz)/mcq/components/CreateQuizForm.tsx`
2. `app/dashboard/(quiz)/openended/components/OpenEndedQuizForm.tsx`
3. `app/dashboard/(quiz)/blanks/components/BlankQuizForm.tsx`
4. `app/dashboard/(quiz)/code/components/CodeQuizForm.tsx`
5. `app/dashboard/(quiz)/document/page.tsx`
6. `app/dashboard/(quiz)/flashcard/components/FlashCardCreate.tsx`

### Related Documentation
- `docs/UNIFIED_AUTH_SUBSCRIPTION_MODAL_UX_COMPLETE.md` - Auth/upgrade modal unification
- `.github/copilot-instructions.md` - Platform development guidelines

---

## 📝 Maintenance Notes

### When Adding New Forms
1. Copy the implementation pattern from this document
2. Use exact className string (no modifications)
3. Use standard customStates messages
4. Test all interactive states
5. Update this document with new form location

### When Updating Styles
1. Update **all 6 forms** simultaneously
2. Update implementation pattern in this document
3. Run visual regression tests
4. Update "Before & After" comparison table

### Version Control
- **v1.0** (Oct 8, 2025): Initial unification across 6 forms
- **Future**: Track any deviations or updates here

---

## ✨ Impact

### User Experience
- **Predictability**: Users know what to expect across all quiz types
- **Trust**: Consistent design signals quality and attention to detail
- **Accessibility**: Uniform sizing ensures all users can interact easily

### Developer Experience
- **Copy-Paste Ready**: New forms can use exact same button code
- **Maintainability**: Single source of truth for button styling
- **Debugging**: Easier to spot outliers and fix issues

### Brand
- **Professional**: Consistent UI = polished product
- **Modern**: Gradient buttons convey contemporary design
- **Recognition**: Users associate blue-indigo with quiz creation

---

**Status**: ✅ All 6 forms updated and consistent  
**Next Review**: When adding new quiz types or major UI refresh
