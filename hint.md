# Hint System Design — Blanks (Cloze) & Open-Ended Questions

Last updated: 2025-09-28

This document specifies an enterprise-quality design and rollout plan for a hint system that helps learners answer "blanks" (cloze) and open-ended questions. The goal is to provide progressive, contextual hints that nudge the learner toward the correct answer while preserving learning value and preventing over-reliance on hints.

## Executive summary

- Problem: Existing hints are unhelpful or too revealing. Learners either remain stuck or get handed the answer.
- Goal: Provide progressive, contextual hints that reveal just enough information to allow learners to reason the answer themselves. Support multiple hint algorithms and an experimentation pipeline to measure effectiveness.
- Scope: Two question types — Blanks (Cloze) and Open-Ended (free text/code). The system is extensible to other question types.

## Contract (Inputs / Outputs / Error modes / Success criteria)

Inputs
- question: structured question object (text, tokens, blanks, metadata)
- learnerAnswer (optional): the current learner input
- context: courseId, chapterId, userId, language
- hint request: { hintTier, hintMode }

Outputs
- hint: { id, hintTier, hintMode, content, confidence, algorithm, meta }
- metadata: { timeToGenerateMs, tokensUsed, cacheHit }

Error modes
- No good hint found (low confidence) → return a gentle fallback (concept hint or example) and log for review
- Rate limited/Quota exceeded → return polite message with next-available time

Success criteria
- Increase in problem resolution without full answer reveal (tracked by: attempts before reveal decrease)
- High helpfulness feedback (thumbs up/down) > 70% in A/B test
- No spike in answer-sharing or cheating signals

## Edge cases to cover

1. Empty or malformed question data (invalid blanks metadata)
2. Very short or ambiguous learner answers (can't compute diffs reliably)
3. Language mismatch (question in different language than configured models)
4. Code answers requiring execution or deterministic checks (unit tests)
5. Vendor/model latency or transient failures

## UX Patterns & Interaction Flow

Core UX principles
- Progressive disclosure: provide multiple hint tiers (light → stronger → reveal) and always let the learner choose to escalate.
- Contextual hints: show hints that fit the question type (syntax hints for code, conceptual hints for short answer).
- Non-spoiler presentation: mask exact token positions when possible; reveal patterns instead of full answers.
- Measurement hooks: show small feedback controls (Was this helpful?) and track usage and outcome.

Suggested hint tiers

1. Tier 1 — Nudge (low reveal)
	- For blanks: highlight part of the blank (first letter, number of letters), show part of POS (e.g., "verb, past tense").
	- For open-ended: show a hint phrase (concept name), or a clarifying question ("Are you thinking about ...?").

2. Tier 2 — Scaffold (moderate reveal)
	- For blanks: reveal a few letters in the middle, provide synonyms or antonyms as clues.
	- For open-ended: provide an outline of a correct answer (2–3 bullet points) or a short example.

3. Tier 3 — Checkpoint (strong reveal)
	- For blanks: reveal the full token but keep learner forced to type it (or copy-disabled). Optionally show correct answer blurred with reveal control.
	- For open-ended: show sample model answer or partial answer; for code, reveal a failing test case or a code skeleton.

4. Final — Full reveal (explicit)
	- Reveal the full answer. Only use after multiple escalations or learner request. If used, mark question as "hint revealed" for analytics and optionally reduce score.

Micro-UX details
- Always display a hint CTA with the cost (if gamified) and current tier. Example: "Hint (Tier 1) — gentle nudge".
- Keep hints compact. Use typography that emphasizes the hint type (italic for conceptual, monospace for code fragments).
- For code blanks, show a runnable sandbox link when appropriate (enterprise customers may enable code execution environments).
- Provide an undo/close affordance and a one-click 'escalate hint' control.

## Hint Types and Algorithms (catalog)

We recommend implementing multiple algorithms and selecting or ranking them per-question using a policy layer.

Algorithm families

1. Exact-string / pattern-based
	- Levenshtein / Damerau-Levenshtein distance for fuzzy string matching.
	- Regex / token pattern suggestions (e.g., expected format: email/date/number).
	- Good for: short blanks, formatting hints, near-miss spelling.

2. Token/grammar-aware
	- POS tagging + dependency parsing to give syntactic hints ("needs a past participle").
	- Named Entity Recognition to suggest entity types ("person/place/date").
	- Good for: language blanks and grammar-focused hints.

3. Embedding / semantic similarity
	- Sentence-transformers or small embeddings for semantic similarity between learner answer and model answers.
	- Use cosine similarity to decide whether to suggest concepts or example answers.
	- Good for: open-ended conceptual questions.

4. Generation (LLM-assisted) — conditional
	- Use guarded LLM prompts to produce hint tiers rather than full answers. Keep strict instructions not to reveal the answer for early tiers.
	- Example prompt-level control: "Return 1–2 conceptual hints. Do NOT reveal the correct answer."
	- Use temperature = 0.0–0.3 for deterministic hints and higher temps for creativity when desired.

5. Code-aware approaches
	- AST diff / symbol recognition + static analysis (ESLint/pyflakes) to suggest the likely bug (e.g., missing return, wrong variable name).
	- Unit-test-driven hints: run a minimal test and provide failing assertion message as hint.
	- Good for: open-ended code answers and code blanks.

Algorithm selection policy
- Use deterministic heuristics to pick a starting algorithm (e.g., blanks use string/token heuristics; open-ended use embeddings + LLM scaffolding).
- Keep an ordered fallback list. Example: Embedding similarity → token grammar → LLM generation (if others fail).
- Attach an explainable label to each hint explaining the algorithm used and its confidence.

## Data shape / API design

API contract (REST / JSON RPC) — example endpoints

POST /api/hints/request
Request body
```json
{
  "userId": "u_123",
  "courseId": "c_456",
  "question": {
	 "id": "q_789",
	 "type": "blank|openended|code",
	 "text": "...",
	 "blanks": [{"index":0,"start":23,"end":30}],
	 "metadata": { }
  },
  "learnerAnswer": "...",
  "hintTier": 1,
  "hintMode": "nudge|scaffold|example|syntax",
  "clientContext": {"locale":"en-US","uiSize":"compact"}
}
```

Response body
```json
{
  "hintId": "h_001",
  "hintTier": 1,
  "hintMode": "nudge",
  "content": "Starts with 'inte' and is a verb in past tense",
  "algorithm": "pos-tagging-v1",
  "confidence": 0.73,
  "meta": {"timeMs": 120, "cacheHit": false}
}
```

Storage model (for analytics & ML)

HintRequests table
- id, userId, questionId, courseId, hintTier, hintMode, algorithm, requestTime, responseTime, confidence, wasHelpful (nullable)

HintResponses table
- hintRequestId, hintId, content (redacted for PII), algorithmMeta

Usage tables for A/B testing and performance metrics

## Scoring, Gamification & Score impact

- Decide policy for hint cost: free (no impact), partial score deduction, or time penalty.
- Store flags on the attempt: {hintUsed: true, hintTierUsed: n} and reflect in analytics.
- For enterprise customers, allow configurable policies per tenant (via admin settings): e.g., "hints reduce final quiz score by 20% if tier >= 3".

## Analytics, A/B testing & metrics

Key metrics to track
- Hint request rate (per question, per user)
- Conversion: hint → correct answer within N attempts
- Helpfulness feedback: thumbs up/down
- Time-to-solve with vs without hint
- Cheating signals: rapid copy/paste or identical answers across users after hint reveal

A/B experiment ideas
- Compare baseline hints vs. scaffolded LLM-based hints
- Compare immediate reveal vs. progressive tiered reveal

Observability
- Log hint generation latency, model calls, and token usage.
- Expose dashboards (Grafana) for per-question performance and per-algorithm effectiveness.

## Privacy, Security & Compliance

- Avoid sending PII to third-party LLMs. Redact or hash sensitive fields.
- Rate-limit hint endpoints per user and per tenant.
- For code execution sandboxes, run in isolated containers with strict resource limits and no access to internal networks.
- Maintain per-tenant configuration and ensure role-based access control for tuning hint policies.

## Operational & Performance considerations

- Caching: cache hint responses by (questionId, hintTier, normalizedLearnerAnswerFingerprint) to reduce model calls for repeated requests.
- Circuit breaker: degrade gracefully to simple heuristics if LLMs are slow or error-prone.
- Batch inference: when many hints are requested (e.g., an instructor preview), batch or queue requests.
- Monitoring: set SLOs for hint latency (e.g., p95 < 500ms for heuristic hints, p95 < 1.5s for LLM-based hints).

## Testing & QA

Unit tests
- Validate algorithm outputs for known inputs (edits distance outputs, embedding similarity thresholds).

Integration tests
- End-to-end hint request → response using a staging LLM or a mocked model that returns deterministic hints.

Human-in-the-loop QA
- Have content authors review generated hints for a percentage of production requests (sampling).

Regression tests
- Ensure no hint leaks full answers for Tier 1 & 2 across a test set.

Accessibility & localization testing
- Ensure hints are readable with screen readers and localized.

Security/pen-testing
- Test sandbox escapes for code execution hints.

## Rollout plan

1. Implement core heuristic hints (tiers 1–2) — deterministic algorithms only. No LLMs.
2. Launch internal beta with analytics & feedback hooks.
3. Add embedding + LLM-based scaffold hints behind a feature flag. Run A/B tests.
4. Iterate on policies & UI copy based on metrics.
5. Add enterprise tenant controls and admin dashboard for hint policies.

## Example hint flows (detailed)

Flow A — Blanks (Cloze)
1. User requests Tier 1 hint.
2. System computes blank token length and POS for surrounding tokens (fast NLP). If POS is reliable, return: "It's a verb (past tense), 6 letters, starts with 'inte'."
3. If learner still wrong and requests Tier 2, return synonyms/antonyms and an example sentence with blank filled but masked (e.g., "The function ___ returns the integer (mask: in**er*)." )
4. Tier 3 reveals the full token with caution and logs the reveal.

Flow B — Open-ended (Conceptual)
1. Learner submits a partial answer. System computes embedding similarity with model answers and top-k relevant concepts.
2. Tier 1 hint: show concept list ("Hint: think about dynamic programming, memoization").
3. Tier 2: return a 2-bullet outline of a good answer. Do NOT provide the full answer.
4. Tier 3: provide sample answer paragraph or example and ask the learner to reflect/compare.

Flow C — Open-ended (Code)
1. Learner code fails tests. Tier 1: show failing assertion messages or the failing line (not full fix). Tier 2: show minimal patch suggest (single line) or a code skeleton. Tier 3: show full reference implementation (behind reveal).

## Governance & content quality

- Provide admin UI for content authors to review, edit, and approve generated hints.
- Maintain a "hint blacklist" to prevent revealing exam keys or copyrighted content.
- Build a retraining pipeline: collect hint helpfulness labels and re-train ranking models for hint selection.

## Implementation checklist (MVP)

1. Build Hint API endpoint and storage tables.
2. Implement Tier 1 heuristics for blanks (length, first letter, POS) and open-ended (concept suggestion via embedding nearest neighbors).
3. Add client UI controls: Hint button, tier escalation, helpfulness feedback.
4. Instrument analytics and logging.
5. Add admin controls for per-tenant policies.

## Next steps

1. Prioritize features: pick which algorithms to enable in phase 1 (recommend: Levenshtein + POS + embeddings).
2. Build a small dataset of 500 representative blank/open-ended questions and expected hint outputs for QA.
3. Implement safe LLM prompt templates for Tier 2 scaffolding and lock them behind feature flags.
4. Run an internal pilot and collect metrics for 2–4 weeks before broader rollout.

---

Appendix A — Helpful prompts (example for LLM scaffold)

Prompt (scaffold, Tier 2 — open-ended):
"You are a helpful tutor. The student asked: '{question_text}'. Do NOT provide the final answer. Instead, provide 2–3 short, concrete hints that guide the student toward the answer. Each hint should be at most 20 words. Avoid revealing exact phrasing; prefer conceptual nudges."

Prompt (safety wrapper):
"If you cannot generate a safe hint without revealing the answer, respond with: 'I can provide a sample explanation if you'd like.'"

Appendix B — Example rubric for 'helpful' labeling

- Helpful: learner attempts again and improves accuracy OR marks hint as helpful within 10 minutes.
- Not helpful: learner does not change answer and marks not helpful OR skips the question.

Contact & ownership

Product owner: [TBD]
Engineering lead: [TBD]
ML/AI lead: [TBD]

## Current implementation mapping, gaps and concrete fixes

This section maps the actual hint-related code in the repository to the design above, lists observed bugs/gaps, and gives concrete, prioritized fixes you can implement immediately. Do NOT change any app behavior without adding tests and a small feature flag for rollout.

Files / components involved
- `lib/utils/hint-system.ts` — core hint generation utilities (functions: `generateBlanksHints`, `generateOpenEndedHints`, `analyzeUserInput`, helpers such as `generateLetterHint`, `generatePartialHint`). This is the single source of truth for generated hint content.
- `components/quiz/UnifiedQuizQuestion.tsx` — imports `generateBlanksHints` and `generateOpenEndedHints` and orchestrates hint requests for the unified quiz question UI.
- `components/quiz/HintSystem.tsx` — UI wrapper that shows hint tiers and feedback controls; imports `analyzeUserInput`.
- `app/dashboard/(quiz)/blanks/components/BlanksQuiz.tsx` — uses `generateBlanksHints(questionData.answer, ...)` when computing hints for blanks questions.
- `app/dashboard/(quiz)/openended/components/OpenEndedQuiz.tsx` — uses `generateContentAwareHints` / `generateContentAwareHints` alias which relies on the hint util to produce open-ended hints.
- `scripts/test-improved-hints.ts` — a test script referencing `lib/utils/hint-system` for ad-hoc tests.
- `store/slices/quiz/*` and `prisma/schema.prisma` have `hints` fields indicating that hints are stored/seeded as strings; this supports backward compatibility with provided hints.

Observed functional gaps & bugs (priority order)

1) No Levenshtein / edit-distance usage
	- Where it matters: `analyzeUserInput` and `generateBlanksHints` do not compute edit distance. They use substring checks and keyword matching. This misses near-miss cases (typos, transpositions) where the system could give a helpful "close" hint (e.g., "You are 1 edit away from the answer").
	- Impact: Learners who mistype a correct short answer don't get a nudge indicating closeness.
	- Fix: Add a lightweight Levenshtein distance implementation (or import a small, zero-dep utility) and compute distance between normalized learner input and normalized correct answer (and per-token for multi-word answers). Use this to produce a structured Blanks hint such as: "4 letters — starts with 'u', ends with 's'; your answer is 1 edit away." For multi-word answers prefer word-level edit distance (Jaccard or token-level Levenshtein).

2) Blanks hints are not explicit enough about counts vs words vs chars
	- Where it matters: `generateStructureHint`, `generateLetterHint`, and `generatePartialHint` exist, but their combined output is inconsistent depending on single vs multi-word answers. Example: if the correct answer is "urls" the desired UX is: "4 letters — starts with 'u', ends with 's'". Current code returns similar content but not in a consistent, single-line, structured hint.
	- Impact: Hints feel ambiguous to learners (word vs letter counts). Also `generatePartialHint` for multi-word answers reveals the first word fully and masks remaining words; the user requested partial sentence reveals for open-ended questions too.
	- Fix: Standardize blank hint outputs: choose one canonical format for blanks (prefer character counts for single-word blanks and word counts for multi-word blanks). Implement a `formatBlankHint(correctAnswer)` that returns an object: `{ words: N, chars: M, firstLetter, lastLetter, perWordLengths: [..] }` and then a single human-friendly string: e.g., "4 letters — starts with 'u', ends with 's'." or "3 words — starts with 'Data', ends with 'Processing' (last word length 10)."

3) Open-ended hints should include a partial sentence reveal option and use edit distance
	- Where it matters: `generateOpenEndedHints` and `generateContentAwareHints` do not produce partial sentence reveals (they provide structure and keywords only).
	- Impact: Learners asked for partial-sentence hints (first 3–6 words, masked continuation) to get direction without being given the full paragraph.
	- Fix: Add a `generatePartialSentenceHint(correctAnswer: string, nWords: number)` helper that returns the first `nWords` of the canonical answer and masks the remainder: e.g., `"The algorithm begins by [mask]..."` or `"Starts with: 'In practice, we' ..."`. Use this as Tier 2 hint for open-ended and ensure the LLM-based scaffold (Tier 2) never returns exact full answer unless Tier 3/4.

4) Hints do not consider prior learner answers stored in state for relative hints
	- Where it matters: the quiz components already hold answers in state (the user explicitly noted this). But `generateBlanksHints` and `generateOpenEndedHints` are called with correctAnswer + questionText + providedHints only — they do not accept the learner's latest attempt to compute edit distance-based suggestions.
	- Impact: We lose the opportunity to provide targeted feedback like "You're 2 edits away from the answer" or "Your answer has the right keywords but wrong order".
	- Fix: Change function signatures to accept `learnerAnswer?: string` (non-breaking: add optional param at the end) and use it in `analyzeUserInput` and blanks hint generation. Update call sites: `BlanksQuiz.tsx` and `OpenEndedQuiz.tsx` should pass current attempt from component state to the generator.

5) Inconsistent masking and reveal behavior
	- Where it matters: `generatePartialHint` reveals entire first word for multi-word blanks. For some assessments this is too strong; or for some UI designs, you prefer revealing first letters of each word.
	- Fix: Make partial reveal configurable: `revealMode: 'firstWord' | 'firstLetters' | 'half'` and let components or tenant policy pick default. Update `generatePartialHint` to accept `revealMode` and produce deterministic masked strings accordingly.

6) Lack of tests and missing small heuristics
	- Where it matters: multiple helper functions have implicit behaviors (case handling, punctuation) and there are no unit tests ensuring `generateLetterHint('URLs')` -> expected string.
	- Fix: Add unit tests for `generateLetterHint`, `generateStructureHint`, `generatePartialHint`, `analyzeUserInput` and for new Levenshtein logic. Add a sample test script (`scripts/test-hints-unit.ts`) demonstrating key inputs and expected outputs.

Concrete change plan (developer steps)

Priority 1 (small, high-impact)
1. Add a small edit-distance helper in `lib/utils/hint-system.ts` or `lib/utils/string.ts`:
	- export function levenshtein(a: string, b: string): number
2. Update `analyzeUserInput` to compute distance when `normalizedInput` and `normalizedAnswer` are short (<= 20 chars) or single-word answers and return messages like: "You're 1 edit away from the correct answer".
3. Update `generateBlanksHints` to accept an optional `learnerAnswer?: string` param and use the new distance helper to add a hint: `{level: 'low', content: 'Your answer is X edits away', ...}` as an early tier.

Priority 2 (behavioral consistency)
1. Implement `formatBlankHint(answer: string)` helper returning canonical fields (word count, char count, first letter, last letter, wordLengths array).
2. Replace `generateStructureHint`, `generateLetterHint` and `generatePartialHint` calls with `formatBlankHint` and a single rendering function `renderBlankHint(formatted, mode)` that returns consistent language.
3. Add `revealMode` parameter to `generatePartialHint` to support multiple masking strategies.

Priority 3 (open-ended partial sentence and state integration)
1. Implement `generatePartialSentenceHint(correctAnswer: string, nWords = 3)` that returns the first nWords and a masked tail.
2. Update `generateOpenEndedHints` to include the partial sentence as the middle (Tier 2) hint when a canonical correctAnswer is available from question metadata.
3. Update call sites (`OpenEndedQuiz.tsx`, `BlanksQuiz.tsx`, `UnifiedQuizQuestion.tsx`) to pass the learner's current attempt (if present) into hint generators.

Quality gates & tests
- Add unit tests for the new helpers and for the existing functions demonstrating expected outputs in edge cases:
  - `levenshtein('urls','url') === 1` and appropriate hint phrase
  - `generatePartialSentenceHint('In practice we do X Y Z', 3) -> 'In practice we ____'
  - `generateBlanksHints('urls', ..., learnerAnswer: 'ur1s')` includes an edit-distance based hint
- Add integration test that simulates UI flow in `scripts/test-improved-hints.ts` and asserts the hint tiers are ordered and non-spoilers for Tier 1.

Rollout & feature flagging
- Put the edit-distance and partial-sentence features behind a feature flag (configurable via env or per-tenant settings) and run a 2-week internal experiment while monitoring helpfulness metric and attempted corrections.

Notes about backward compatibility
- Signature changes to hint generators should be additive (optional final parameter `learnerAnswer?: string`) so existing call sites still work until you update them.
- Persisted `hints` strings in DB remain compatible because generated hints are runtime-only content; only the storage schema for `HintRequests`/`HintResponses` is new and additive.

If you want, I can implement the minimal code changes (levenshtein helper, signature update, analysis integration) and add a small unit test suite next — tell me if you prefer the change split into separate commits per priority so we can review incrementally.
