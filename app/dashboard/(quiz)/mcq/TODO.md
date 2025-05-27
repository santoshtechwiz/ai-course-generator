# MCQ Quiz Flow and TODOs

## Quiz Flow - User Journey

1. **Access Quiz**
   - User navigates to `/dashboard/mcq/[slug]`
   - System loads quiz data from API
   - Quiz data normalized to consistent format (all options as `{id, text}` objects)

2. **Take Quiz**
   - User sees one question at a time
   - User selects an answer and clicks "Save Answer"
   - System saves answer locally (Redux state + session storage)
   - User can navigate between questions
   - Progress is auto-saved after each answer

3. **Complete Quiz**
   - User answers all questions or reaches the end
   - System calculates score and generates results
   - Results are stored in session storage

4. **View Results**
   - User is directed to `/dashboard/mcq/[slug]/results`
   - Results show score, percentage, and question-by-question breakdown
   - User can download, share, retry quiz, or go back to quiz list

## Authentication Flow

1. **Unauthenticated User:**
   - Can take quiz
   - Progress saved in session storage with anonymous session ID
   - When viewing results, prompted to sign in
   - After sign-in, results are preserved and migrated to user account

2. **Authentication Transition:**
   - Quiz state stored before redirect to auth
   - After successful auth, redirected back with auth=return param
   - SessionManager recovers quiz state and regenerates results

3. **Authenticated User:**
   - Progress and results associated with user account
   - Can access history of completed quizzes

## Logout Handling

1. **Logout from Quiz Page:**
   - Clean session
   - Redirect to quizzes list

2. **Logout from Results Page:**
   - Clean session
   - Redirect to quiz page rather than showing "No Results Found"

## TODOs

### High Priority

- [ ] Standardize option format across all components (always use `{id, text}` objects)
- [ ] Consolidate answer field names (use `correctOptionId` consistently)
- [ ] Import types from central `types.ts` file rather than redefining
- [ ] Fix results page redirect after logout
- [ ] Ensure all authentication edge cases are handled

### Medium Priority

- [ ] Add comprehensive error handling for API failures
- [ ] Improve quiz state recovery with IndexedDB fallback
- [ ] Optimize bundle size by code splitting quiz components
- [ ] Add analytics tracking for quiz completions
- [ ] Improve accessibility of quiz components

### Low Priority

- [ ] Add quiz timer option
- [ ] Support more question types beyond MCQ
- [ ] Add quiz difficulty setting
- [ ] Allow users to bookmark questions for later review
- [ ] Add social sharing functionality for quiz results

## Architecture Improvements

- [ ] Move all auth and session logic to SessionManager
- [ ] Create central quiz state normalization utilities
- [ ] Add strict type checking for quiz data
- [ ] Set up comprehensive test suite for quiz flow
- [ ] Document component API and state management approach
