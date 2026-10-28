# ExamPilot NG — Kiro AI Build Specification

**Product:** ExamPilot NG  
**Tagline:** *Study smarter. Practise better. Ace your exams.*  
**Product type:** AI-powered exam preparation platform for Nigerian university students  
**Primary goal:** Recreate the existing ExamPilot NG application built in Floot as closely as possible, while making the codebase reliable, responsive, secure, and fully functional.

---

## 1. Instructions to Kiro AI

You are continuing an existing project. Do not treat this as a blank-slate redesign.

1. First inspect the entire supplied repository, including `package.json`, `src/main.jsx`, `src/styles.css`, `server/index.js`, `README.md`, and `.env.example`.
2. Preserve the existing working structure and features wherever practical. Refactor only when needed for correctness, accessibility, security, maintainability, or fidelity to the reference.
3. The provided ZIP is a reconstructed starter rather than a guaranteed byte-for-byte export of the Floot project. Use this specification, the current source code, and any screenshots or live preview the user supplies together. If the Floot preview is available, inspect it before making visual changes.
4. Match the reference's layout, information hierarchy, spacing, typography, colours, sidebar/navigation, cards, forms, labels, icons, charts, and page behaviour. Do not invent a new brand identity or replace the interface with a generic template.
5. Do not remove an existing feature just because it is unfinished. Complete it, or clearly document any external setup it requires.
6. Do not fake successful operations. A save, login, AI answer, test submission, upload, or database operation must only show success after it actually succeeds.
7. Keep code clean and production-minded. Do not add explanatory comments throughout the code; use clear names and concise documentation where useful.
8. Work in small, testable phases. Run the project, inspect errors, type-check/lint where configured, and fix issues before finishing.
9. Never place API keys, database passwords, session secrets, or other credentials in browser code, committed files, source maps, logs, or this specification.
10. Do not claim the product is production-ready until the security, persistence, AI, and CBT requirements below have been implemented and tested.

### Reference priority

When sources conflict, use this priority:
1. The user's explicit instructions in the current conversation.
2. The actual Floot preview/screenshots supplied by the user.
3. The current source code and its existing behaviour.
4. This written specification.
5. Reasonable implementation decisions that preserve the product's intent.

If the exact Floot appearance cannot be inspected, preserve the existing starter's design rather than guessing at a radically different interface.

---

## 2. Product vision and learning loop

ExamPilot NG is not just an AI chatbot. It is one connected study system:

**Study → Understand → Practise → Measure → Identify weaknesses → Revise → Practise again.**

Students should be able to organise courses, save their lecture notes, understand difficult material with AI assistance, generate practice questions, take timed computer-based tests (CBT), review results, identify weak topics, and plan their next revision sessions.

The product is intended for Nigerian university students. Use clear, natural English and examples relevant to university study in Nigeria when appropriate. Do not make unsupported claims about exam success, official examination-board affiliation, user numbers, or institutional partnerships. Clearly label generated questions as practice questions, never as official or leaked exam questions.

---

## 3. Visual design and brand direction

### 3.1 Overall feel

Build a polished, calm, professional educational dashboard with a distinctive **“exam-hall stationery”** visual idea: a well-made academic notebook combined with a precise test paper. The interface should feel trustworthy, focused, readable, and useful during long study sessions.

The reference design uses:
- Deep navy for the sidebar and major text.
- Warm ivory/off-white backgrounds.
- White or near-white content cards.
- Restrained teal as the main action/selection colour.
- Muted blue-grey secondary surfaces.
- Fine neutral borders and subtle shadows.
- Clean typography with an editorial display face for major headings and a readable sans-serif for interface text.
- Consistent spacing, compact metadata, rounded but restrained corners, and clear visual grouping.

Use the existing CSS variables and tokens in `src/styles.css` as the first reference. The Floot reference's design tokens include approximately:
- Background: `#f7f5ef`
- Main text/navy: `#14213d`
- Surface: `#efece3`
- Card: `#fffdf8`
- Primary teal: `#0f766e`
- Secondary: `#e4e9f2`
- Accent: `#d9efec`
- Muted: `#ebe8df`
- Muted text: `#5b6578`
- Border: `#d9d5c8`
- Error: `#b42318`
- Warning: `#b45309`
- Display font: Newsreader (serif)
- Body font: IBM Plex Sans
- Monospace/technical text: IBM Plex Mono

These values are guidance from the Floot design system, not a reason to ignore the supplied screenshot or the existing CSS. Reuse existing CSS variables rather than scattering literal colours across components.

### 3.2 Layout

- Desktop: persistent left navigation/sidebar and a flexible main content area.
- Main content should have a sensible maximum width and generous but controlled spacing.
- Page headings should include a title, concise supporting description when appropriate, and page-level actions aligned consistently.
- Use consistent cards, summary metrics, progress bars, tabs, filters, form fields, dialogs, badges, and empty states.
- Keep important study actions visible without turning every section into a large call-to-action.
- Charts must have labels, accessible descriptions, sensible empty states, and responsive sizing.
- Avoid visual clutter, gratuitous gradients, excessive glassmorphism, giant rounded pills, oversized empty hero sections inside the authenticated dashboard, or unnecessary animation.
- Use a consistent icon set already present in the project, if available. Do not mix emoji with professional UI icons as a substitute for an icon library.

### 3.3 Motion

- Keep transitions subtle and quick for buttons, cards, navigation, dialogs, and feedback.
- Use smooth anchor scrolling only where it helps navigation.
- Do not add dramatic scroll-triggered entrance effects, heavy parallax, or animation that delays access to content.
- Respect `prefers-reduced-motion`.
- All functionality and content must remain available when motion is disabled.

### 3.4 Responsive design

The app must work from a 320px-wide phone through small tablets, laptops, and wide desktop screens.

- Desktop: sidebar plus main content.
- Tablet: reduce grid columns and spacing; ensure sidebar does not squeeze the content.
- Mobile: use a compact navigation drawer, sheet, or bottom/navigation pattern consistent with the supplied reference. It must be easy to open and close.
- Never allow page-level horizontal overflow.
- Forms, dialogs, charts, tables, option lists, test navigation, and buttons must fit small screens.
- Stack multi-column forms and summary grids at appropriate breakpoints.
- Long course names, notes, questions, and user-generated text must wrap safely.
- Use touch targets that are comfortable on mobile.
- Account for browser safe areas where appropriate.
- Test at minimum widths of 320px, 375px, 393px, 768px, 1024px, and 1440px.
- Ensure reduced-motion preferences are honoured.

---

## 4. Application structure and navigation

Keep the app's navigation predictable and consistent. The primary authenticated navigation should cover:

1. **Dashboard**
2. **Courses**
3. **Study Materials**
4. **AI Study Assistant**
5. **Question Bank / Question Generator**
6. **CBT Practice**
7. **Revision Planner**
8. **Performance / History**
9. **Settings / Profile**

Use the routes already present in the project if possible. If routing is not yet implemented, add a reliable routing solution and make browser back/forward work correctly. Deep links should load the correct page rather than always returning to the dashboard. Protect authenticated pages and redirect unauthenticated users to the login page.

The public landing page should explain the product, how it works, and its major benefits. It should include a clear route to register or sign in. Avoid fake testimonials, made-up usage statistics, and unsupported outcome claims. Keep the footer natural and useful; do not add the phrase “Built for the OPEN//BUILD 2026 Hackathon.”

---

## 5. Page-by-page requirements

### 5.1 Public landing page

Purpose: quickly explain what ExamPilot NG does and help a student get started.

Include:
- ExamPilot NG wordmark and concise navigation.
- Hero headline and supporting copy focused on smarter, structured exam preparation.
- Primary action to create an account and secondary action to sign in or explore features.
- Feature overview covering study materials, AI explanations, practice questions, timed CBTs, performance insights, and revision planning.
- A simple “How it works” sequence showing the study loop.
- Clear, honest descriptions of AI capabilities and limitations.
- Responsive footer with product/navigation links as appropriate.

Avoid unsupported testimonials, fake user counts, fabricated university endorsements, fake scores, or claims that AI-generated questions are official exam questions.

### 5.2 Registration and login

Registration fields:
- Full name.
- Email.
- Password.
- Confirm password if the current UI includes it.

Login fields:
- Email.
- Password.
- Show/hide password control where appropriate.
- Clear validation and error feedback.
- Loading state while submitting.
- Link between login and registration.
- Password reset only if the required email or reset-token flow is actually configured and tested.

Requirements:
- Validate on both client and server.
- Normalise email addresses.
- Hash passwords using a modern password hashing algorithm/library.
- Never store or log plaintext passwords.
- Protect private routes.
- Use secure session handling and appropriate cookie settings.
- Show clear errors without exposing internal implementation details.
- A successful login should take the user to their dashboard.
- Logout must invalidate the session and return the user to a public/login state.

### 5.3 Dashboard

The dashboard is the user's study command centre, not a chatbot landing page.

Include:
- Personalised welcome/header.
- Summary cards for total courses, saved study materials, questions attempted, and relevant progress.
- Recent CBT attempts and scores.
- Progress/trend visualisation based on real stored attempts.
- Weak topics calculated from actual answer data.
- Upcoming revision tasks and overdue tasks.
- Quick actions to add a course, save notes, generate practice questions, start a CBT, and open the planner.
- Useful first-run empty states that explain how to begin.

Rules:
- All metrics must come from real data.
- Do not hardcode impressive-looking numbers.
- If a user has no data, show zero/empty states and helpful actions.
- Do not infer weak topics from unrelated activity or fabricate a score trend.
- Loading, error, empty, and populated states must all be designed.

### 5.4 Courses

Students can create and organise their own courses.

Course fields:
- Course title/name (required).
- Course code (optional).
- Description (optional).
- Semester/term (optional).
- Academic level/year (optional).

Features:
- List and search/filter courses.
- Create and edit courses.
- Delete a course with a confirmation step.
- Course detail page with its saved materials, practice questions, and CBT attempts where available.
- Show useful counts, such as associated materials and attempts.
- Clear empty states when a course has no materials or questions.
- Validate all fields on the server.
- A user can only access or modify their own courses.
- If deleting a course affects related data, explain the consequence and use a deliberate deletion policy; do not silently orphan data.

### 5.5 Study materials

Students must be able to store their own lecture notes and study content.

Features:
- Add material by pasting text.
- Upload supported text files, at minimum `.txt` and `.md`, if upload support exists in the starter; clearly state accepted formats and size limits.
- Give each material a title and optionally associate it with a course.
- View and search saved materials.
- Filter by course.
- Open, edit, and delete a material.
- Show created/updated date and course association.
- Provide actions to ask the AI assistant about the material and generate practice questions from it.
- Confirm destructive deletion.
- Validate file extension, MIME/type where available, size, and text content on the server. Do not trust only the file input's `accept` attribute.
- Treat uploaded content as untrusted text. Do not execute it as code or HTML.
- Show clear upload, parsing, save, and failure feedback.
- Prevent accidental loss of unsaved text when feasible.

The app should not claim that it can read PDFs, images, or Word documents unless those formats are explicitly implemented and tested. If additional formats are added, use a reliable parser and report unsupported/corrupt files clearly.

### 5.6 AI study assistant

Purpose: help students understand their own lecture material, not simply provide a generic chat interface.

Features:
- Conversation-style interface with a clear input and send action.
- Let the student select a saved study material or course as context.
- Support explanations, summaries, examples, definitions, and step-by-step walkthroughs.
- Keep conversation history for the signed-in user.
- Allow useful responses to be saved/bookmarked and later reviewed.
- Support retry or graceful recovery when the model times out or is unavailable.
- Show loading state while a response is generated.
- Disable duplicate sends while a request is in progress, or handle them safely.
- Display a clear error if the AI provider is not configured.

AI behaviour:
- Use selected lecture notes as context whenever available.
- Prefer explanations grounded in the selected notes.
- When possible, mention the relevant heading/section used.
- If the notes do not contain the answer, say so clearly and distinguish general knowledge from material-based content.
- Do not fabricate quotations, page numbers, or citations.
- Encourage students to verify important material with their lecture notes and lecturers.
- Never promise perfect accuracy.
- Apply sensible request size, rate, timeout, and output limits.
- Do not expose provider keys to the browser.
- Do not send private student content to external providers without the app's documented and expected AI processing behaviour.
- Avoid logging full private notes or entire chat histories unnecessarily.

### 5.7 Question generator and question bank

Students can generate and manage practice questions from their own materials.

Generation inputs:
- Course.
- Source material, if available.
- Number of questions.
- Question type; multiple-choice questions (MCQs) are the required baseline.
- Difficulty: easy, medium, or hard.
- Topic or focus area when practical.

Every MCQ should contain:
- Question text.
- A set of answer options (normally four).
- One correct option.
- A concise explanation for the correct answer.
- Topic label where possible.
- Optional source-material reference where it can be grounded honestly.

Requirements:
- Validate the model's output against a strict schema on the server.
- Reject or repair malformed questions; never trust raw AI output as application data.
- Ensure the correct answer maps to one of the provided options.
- Avoid duplicate or near-identical questions in a single generation batch where feasible.
- Never describe generated practice questions as official, leaked, or guaranteed exam questions.
- Save generated questions to the user's question bank.
- Allow students to review, filter, and select saved questions for a CBT practice session.
- Include loading, empty, retry, validation, and error states.
- If AI generation is unavailable, show a clear message rather than returning fake AI-generated results.

### 5.8 CBT practice

This is a core feature and must behave like a real computer-based test.

Setup:
- Select a course or question set.
- Select the number of questions, within the available question count.
- Select duration where the interface supports it.
- Show a clear test summary before starting.

Test-taking interface:
- Show one question at a time unless the existing reference explicitly uses another layout.
- Display question number and total count.
- Provide previous/next navigation.
- Provide a question navigator/palette showing answered and unanswered questions.
- Clearly show the selected answer.
- Display a visible countdown timer.
- Allow answers to be changed before submission.
- Persist answer selections as the user proceeds.
- Warn about unanswered questions when manually submitting.
- Confirm manual submission.
- Automatically submit when time expires.
- Support keyboard navigation where practical without compromising accessibility.
- Remain usable on mobile screens.
- Warn before leaving an active test if answers may be lost.

Security and correctness:
- Create a test attempt on the server.
- The server's recorded start time and duration are the source of truth. Do not trust a client-only countdown to decide whether a test is still valid.
- Store answers server-side as they change or at a safe interval.
- Score the attempt on the server only.
- Never send correct answers to the client before submission.
- Verify that the selected questions belong to the current user's accessible set.
- Prevent duplicate submissions from creating multiple results.
- Make submission idempotent.
- Prevent users from reading or changing another user's attempt.
- Handle expired sessions and network failures without silently losing submitted answers.
- On refresh, restore the active attempt and saved answers if it is still valid.

### 5.9 Results and review

After a submitted CBT, show:
- Total questions.
- Correct and incorrect answers.
- Score percentage.
- Time taken.
- Per-question review.
- Correct answer and explanation for each question.
- Topic-level performance when sufficient data exists.
- Suggested revision topics based on evidence.
- Actions to review mistakes, return to the question bank, or start another practice session.

Do not expose answers during an active test. Make the distinction between an active attempt and a submitted result explicit. Score calculations must be consistent and performed server-side.

### 5.10 Performance and history

Provide a history of completed attempts with:
- Course/test label.
- Date.
- Score and question count.
- Time taken when available.
- Score trend chart.
- Filter by course or time period if practical.
- Link to review a submitted attempt.

All charts and statistics must be computed from real attempts. Avoid implying that a short history is a statistically reliable trend. Empty states should guide the student to take their first practice test.

### 5.11 Revision planner

Students should be able to create and manage revision tasks.

Task fields:
- Task title (required).
- Optional description.
- Course association.
- Due date.
- Completion status.

Features:
- Create, edit, complete/uncomplete, and delete tasks.
- Filter by all, upcoming, completed, and overdue where appropriate.
- Show due dates clearly.
- Identify overdue tasks accessibly.
- Show summary counts.
- Confirm deletion where appropriate.
- Persist task changes.
- Ensure one user cannot access another user's tasks.

Recommendations:
- Use transparent rule-based recommendations from actual performance, such as revisiting a topic after repeated low scores.
- Only recommend weak topics when enough answer data exists.
- Label rule-based recommendations differently from AI-generated suggestions.
- Do not create fake evidence or imply that a recommendation is scientifically guaranteed.

### 5.12 Settings and profile

Include:
- Update display name and other supported profile details.
- Show email and whether it can be edited.
- Change password with current-password verification where applicable.
- Clear success/error messages.
- Logout.
- Secure account-related forms.
- Validate changes on the server and persist them.
- Do not show success until the backend confirms the change.

---

## 6. Data model and persistence

Use a real persistent database for production-capable behaviour. Do not rely on browser `localStorage` as the only storage for private user data, CBT attempts, scores, passwords, or AI conversations. `localStorage` may be used for harmless preferences or temporary UI state only.

Suggested relational entities:

### Users
- `id`
- `name`
- `email` (unique, normalised)
- `password_hash`
- `created_at`
- `updated_at`

### Courses
- `id`
- `user_id`
- `title`
- `course_code` (nullable)
- `description` (nullable)
- `semester` (nullable)
- `academic_level` (nullable)
- `created_at`
- `updated_at`

### Study materials
- `id`
- `user_id`
- `course_id` (nullable)
- `title`
- `content_text`
- `source_filename` (nullable)
- `created_at`
- `updated_at`

### Questions
- `id`
- `user_id`
- `course_id` (nullable)
- `material_id` (nullable)
- `question_text`
- `options` (structured JSON or related table)
- `correct_option` (server-only until review)
- `explanation`
- `topic` (nullable)
- `difficulty`
- `source_type` (e.g. generated or manually created)
- `created_at`

### Exam attempts
- `id`
- `user_id`
- `course_id` (nullable)
- `status` (in progress, submitted, expired)
- `started_at`
- `expires_at` or server-controlled duration
- `submitted_at` (nullable)
- `total_questions`
- `correct_count` (nullable until submission)
- `score_percent` (nullable until submission)
- `duration_seconds` (nullable or calculated)
- `created_at`

### Attempt answers
- `id`
- `attempt_id`
- `question_id`
- `selected_option` (nullable)
- `is_correct` (set by the server at finalisation)
- Unique constraint on `(attempt_id, question_id)`.

### Study tasks
- `id`
- `user_id`
- `course_id` (nullable)
- `title`
- `description` (nullable)
- `due_date` (nullable)
- `is_completed`
- `created_at`
- `updated_at`

### AI conversations and messages
- `id`, `user_id`, optional course/material reference, title, timestamps.
- Messages should store role, content, timestamps, and optional safe metadata.
- Saved/bookmarked assistant responses should be associated with the owning user.

Add appropriate foreign keys, indexes, uniqueness constraints, timestamps, and deletion rules. Match the existing codebase's database technology when it is already configured; do not introduce a second database unnecessarily.

All reads and writes involving private data must be scoped to the authenticated user. Check ownership server-side on every endpoint, not merely by hiding buttons in the UI.

---

## 7. Backend and API requirements

Use the backend framework already present in the repository if it is sound. Keep API logic out of presentation components. Validate request bodies and responses with a schema library already installed where practical.

Create or maintain well-defined API operations for:
- Authentication: register, login, logout, session/current user, profile update, password change, password reset if configured.
- Courses: list, create/update, detail, delete.
- Materials: list, get/detail, create/update, delete, upload/parse supported text.
- AI assistant: ask a question, manage messages/conversations, save/bookmark a response.
- Question generation: generate and validate questions.
- Questions: list, save, update if supported, delete.
- CBT: start attempt, get/resume session, save answer, submit, retrieve result/review.
- Performance: overview metrics, attempt history, weak-topic computation.
- Planner: list, create/update, complete, delete tasks.

For every API endpoint:
- Validate input and reject invalid data with a consistent error shape.
- Check authentication when required.
- Enforce ownership.
- Handle missing resources and conflicts.
- Avoid returning sensitive fields.
- Use suitable HTTP status codes.
- Add reasonable rate limits to expensive AI endpoints and authentication endpoints.
- Add request timeouts and safe error handling.
- Never reveal stack traces, provider secrets, or database credentials to the client.
- Avoid logging passwords, tokens, complete private notes, or secret-bearing request headers.

If the supplied starter's backend is only a scaffold, implement the necessary endpoints instead of silently leaving buttons disconnected. Document any remaining external service configuration clearly.

---

## 8. AI provider and environment configuration

The AI assistant and question generator require a supported model provider. Implement a server-side provider adapter so the provider can be changed without rewriting the frontend.

- Keep all model calls on the server.
- Read the API key from a server-only environment variable.
- Never prefix a secret with `VITE_` or expose it in client-side code.
- Use request timeouts, response-size limits, schema validation, and safe error handling.
- Clearly report when the provider key is missing, invalid, rate-limited, or unavailable.
- Do not return hardcoded sample answers as if they were generated live.
- Do not put any real API key into `.env.example`, documentation, the ZIP, source control, or screenshots.

Create or update `.env.example` with placeholder values only, for example:
- `AI_API_KEY=replace_with_your_own_key`
- `AI_MODEL=replace_with_supported_model`
- `DATABASE_URL=your_database_connection_string`
- `SESSION_SECRET=replace_with_a_long_random_secret`
- `PORT=3001`

Use only the variables the implementation actually needs, and update `README.md` with setup steps. The exact provider and model should be configurable. If the app uses a third-party OpenAI-compatible endpoint, support a server-side base URL configuration only if necessary and document it. Do not assume an API key supplied in a previous conversation is valid or safe; credentials shared in chat should be rotated and replaced privately.

---

## 9. Security, privacy, and reliability

Implement these baseline protections:
- Password hashing; never store plaintext passwords.
- Secure session/token handling and protected routes.
- Server-side ownership checks for every private resource.
- Input validation and output encoding.
- Safe file upload handling.
- No secrets in browser bundles or source control.
- Appropriate CORS policy for the deployed frontend/backend setup.
- Rate limiting for login, registration, AI generation, and other expensive endpoints.
- Avoid SQL injection by using parameterised queries or the project's ORM/query builder.
- Prevent duplicate CBT submissions and enforce server-side timing.
- Do not send correct answers to the browser before submission.
- Prevent IDOR-style access to another user's courses, materials, tasks, chats, or attempts.
- Do not expose private note content through public static file paths.
- Provide useful error messages without revealing internal implementation details.
- Handle network failures and interrupted AI requests.
- Use transactions for operations that must succeed or fail together.
- Avoid deleting related data unexpectedly.
- Keep third-party credentials server-only.

Do not claim legal, regulatory, or security compliance unless it has actually been assessed.

---

## 10. Accessibility and usability

- Use semantic HTML and a logical heading order.
- Every input must have a visible or programmatic label.
- Buttons must have clear accessible names.
- All core actions must work with keyboard navigation.
- Visible focus states must be maintained.
- Do not communicate status through colour alone.
- Ensure readable contrast for text, muted text, badges, charts, and controls.
- Dialogs should manage focus and support keyboard dismissal where appropriate.
- Announce important asynchronous status changes to assistive technology where practical.
- Form errors should be associated with their fields.
- Respect reduced motion and browser zoom.
- Do not disable browser zoom.
- Ensure the CBT countdown is available to the user without excessively disruptive announcements every second.

---

## 11. Loading, empty, success, and error states

Every data-driven page must handle:
- Initial loading.
- Empty data.
- Successful load.
- Failed request.
- Save in progress.
- Save success.
- Validation failure.
- Retry where safe.
- Destructive action confirmation.
- Expired session.
- Offline/network failure where practical.

Use consistent skeletons or spinners only when they improve the experience. Keep existing content visible during background refresh where appropriate. Do not use an endless spinner when a request has failed. Show honest feedback and a next action.

---

## 12. Suggested implementation architecture

Follow the existing project structure when possible. If restructuring is needed, use a clear separation such as:

- `src/` — browser application.
  - `components/` — reusable UI components.
  - `pages/` or `routes/` — page-level screens.
  - `lib/` — API client, validation helpers, utilities.
  - `hooks/` — reusable client hooks.
  - `styles/` — global tokens and styles.
- `server/` — server entry, route handlers, auth, AI adapter, persistence.
- `tests/` — unit and integration tests.

Keep reusable elements consistent:
- App shell and navigation.
- Page header.
- Summary metric card.
- Empty state.
- Loading state.
- Form field/error message.
- Confirmation dialog.
- Toast/notification.
- Course/material/question cards.
- CBT question navigator.
- Result summary and charts.

Avoid one enormous component for the whole application. Avoid duplicating the same layout and data logic across pages. Do not add unnecessary libraries when existing dependencies cover the need.

---

## 13. Testing and acceptance criteria

Do not stop after the landing page looks good. The main user journeys must work.

### Visual and responsive
- [ ] Interface closely matches the Floot reference or supplied screenshots.
- [ ] Existing visual language is preserved: navy, warm off-white, teal, restrained cards, consistent typography.
- [ ] No horizontal overflow at 320, 375, 393, 768, 1024, or 1440px.
- [ ] Mobile navigation opens, closes, and navigates correctly.
- [ ] Forms, dialogs, charts, question options, and test navigator fit mobile screens.
- [ ] Reduced-motion preference is respected.

### Authentication and data ownership
- [ ] A new user can register, sign in, and sign out.
- [ ] Invalid credentials and invalid input show clear errors.
- [ ] Private pages require authentication.
- [ ] User A cannot access User B's courses, materials, tasks, conversations, questions, or attempts by changing IDs.
- [ ] Passwords are hashed and no secrets appear in browser code.

### Courses and materials
- [ ] A course can be created, edited, listed, and deleted with confirmation.
- [ ] Notes can be added, saved, viewed, edited, and deleted.
- [ ] Course filtering and search work where present.
- [ ] Unsupported/oversized uploads are rejected with clear messages.
- [ ] Data remains after reload and after signing out/in.

### AI and questions
- [ ] AI assistant sends a real server-side request when configured.
- [ ] Missing/invalid AI configuration produces a clear error.
- [ ] Selected material is used as context.
- [ ] AI output is validated before being displayed or saved.
- [ ] Generated questions have options, one valid correct answer, explanation, and topic when available.
- [ ] Saved questions can be selected for practice.

### CBT
- [ ] A student can start an attempt and answer questions.
- [ ] Previous/next and question navigator work.
- [ ] Answers survive refresh/reconnect when possible.
- [ ] Server controls test timing and scoring.
- [ ] Expiry auto-submits or finalises the attempt safely.
- [ ] Manual submit confirms and handles unanswered questions.
- [ ] Duplicate submit does not create duplicate results.
- [ ] Correct answers remain hidden until submission.
- [ ] Results and explanations match server-side scoring.

### Planner and progress
- [ ] Tasks can be created, edited, completed, filtered, and deleted.
- [ ] Dashboard statistics reflect actual database records.
- [ ] History displays submitted attempts and scores accurately.
- [ ] Weak topics are based on actual answers and are not fabricated.
- [ ] Empty states appear when a new account has no history.

### Quality
- [ ] No broken imports or missing assets.
- [ ] No severe console errors during normal use.
- [ ] Backend endpoints validate requests and return consistent errors.
- [ ] Project starts using the documented commands.
- [ ] Automated tests cover core utilities and critical backend logic.
- [ ] README accurately documents local setup, environment variables, and limitations.

---

## 14. Recommended build sequence

Implement in this order, preserving the reference UI throughout:

**Phase 1 — Audit and visual fidelity**
- Inspect the supplied ZIP and understand the existing structure.
- Run the app and note all current routes and behaviours.
- Compare against the Floot preview/screenshots if available.
- Correct layout, responsive behaviour, typography, colours, navigation, and component consistency.

**Phase 2 — Routing and authentication**
- Complete routing, registration, login, session persistence, logout, and protected routes.
- Add or connect persistent storage and verify user isolation.

**Phase 3 — Courses and study materials**
- Implement course CRUD and notes CRUD/upload.
- Connect the dashboard to real course/material data.

**Phase 4 — AI assistant and question generator**
- Implement the server-side provider adapter.
- Ground explanations in selected notes.
- Validate and save generated questions.

**Phase 5 — CBT and results**
- Implement server-created attempts, answer persistence, server timing, server scoring, idempotent submission, result review, and attempt history.

**Phase 6 — Planner and performance**
- Implement task CRUD and filters.
- Compute dashboard metrics, score history, and weak-topic recommendations from actual data.

**Phase 7 — Polish and verification**
- Improve empty/loading/error states and accessibility.
- Test mobile layouts and critical user journeys.
- Fix all runtime/build errors.
- Update documentation and report any external credentials/services still required.

Do not move to the next phase while the current phase has major broken behaviour.

---

## 15. Definition of done

The project is complete when:
1. It preserves the ExamPilot NG identity and closely reproduces the supplied Floot UI/reference.
2. All main navigation items lead to complete, usable pages.
3. Authentication and user-specific data are secure.
4. Courses and study materials persist in the database.
5. AI explanations and question generation work with a privately configured provider key.
6. CBT attempts are timed and scored securely on the server.
7. Results, performance history, weak topics, and revision tasks use real data.
8. The application works on mobile, tablet, and desktop without horizontal overflow.
9. Critical flows have been tested and the project starts using the documented commands.
10. The README explains configuration and any remaining external setup honestly.

At the end, give the user a concise implementation report:
- Features completed.
- Main files created/changed.
- Tests actually run and their results.
- Required environment variables or provider setup.
- Any known limitations that remain.

**Final instruction:** Build the actual working application, not just a mockup. Keep the reference design intact, connect the pages to real data and backend operations, and never represent demo data or simulated AI responses as live functionality.
