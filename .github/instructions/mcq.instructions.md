/*
Goal: Generate code for Multiple Choice Questions (MCQ) components/features.

Coding standards:
- Use TypeScript with strict typing.
- Use React functional components with hooks.
- Use clear, descriptive variable and function names.
- Include proper error handling and loading states.
- Follow accessibility best practices (e.g., proper ARIA roles, keyboard navigation).
- Use Tailwind CSS classes for styling.
- Keep components modular and reusable.
- Use consistent formatting and comments to explain logic.
- Avoid unnecessary complexity; keep logic simple and clear.

Domain knowledge:
- MCQ questions have one correct answer and multiple options.
- Each option is a clickable choice.
- On selection, provide immediate feedback (correct/incorrect).
- Support question review mode to show correct answers.
- Allow for next/previous question navigation.
- Support tracking of user's selected answers.
- Store answers in local/session storage or state (avoid backend saves unless specified).
- Support loading questions asynchronously (e.g., from API or props).
- Provide clear UI states for unanswered, answered-correct, answered-incorrect.

Preferences:
- Use React Context or Redux only if necessary, otherwise use component-level state.
- Include TypeScript interfaces/types for questions, options, and answers.
- Use utility functions for answer validation and scoring.
- Support theming (light/dark) via Tailwind or CSS variables.
- Provide hooks or callback props for submission and progress tracking.
- Write unit-test friendly code (pure functions, clear separation of concerns).

Example prompt for Copilot:
"Generate a TypeScript React component named `McqQuestion` that takes a question object as a prop with options and the correct answer, renders the options as buttons styled with Tailwind CSS, handles user selection, shows immediate feedback with green/red highlights, and supports accessibility features."

---

