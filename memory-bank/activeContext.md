# Active Context: bolt_adapt

## Current Focus

- **Task:** Improve PWA offline capabilities.
- **Goal:** Implement runtime caching in the service worker (`public/service-worker.js`) using Workbox strategies to cache API calls (Supabase data) and improve SW lifecycle management, enabling better offline usability as requested by the user.

## Recent Changes

- Created all core Memory Bank files (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`).
- Reviewed core setup files (`package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`).
- Reviewed core modules (`src/lib/supabase.ts`, `src/stores/authStore.ts`, `src/lib/sw-reg.ts`, `public/service-worker.js`, `src/components/Layout.tsx`, `src/stores/appStore.ts`).
- Updated Memory Bank files with initial findings.

## Next Steps (Assessment Plan)

1.  **Review Error Handling & Debugging:**
    *   `src/lib/error-handling.ts`
    *   `src/stores/debugStore.ts`
    *   `src/components/ErrorBoundary.tsx`
    *   `src/components/DebugPanel.tsx`
2.  **Analyze Feature Areas (High-Level):**
    *   Habit management (`src/pages/habits/`, `src/components/habits/`) - Key components? Data fetching? State?
    *   Profile management (`src/pages/Profile/`, `src/components/profile/`) - Key components? Data fetching? State?
    *   Admin section (`src/pages/admin/`, `src/components/admin/`) - Key components? Functionality?
3.  **Examine Supabase Structure:**
    *   Review migrations (`supabase/migrations/`) - Identify key tables and relationships.
    *   Review function code (`supabase/functions/createNotification/index.ts`).
    *   Check for RLS policies (requires Supabase access or schema dump).
4.  **Identify Potential Issues:** Continue looking for code smells, complexity, lack of tests, performance bottlenecks, PWA best practice adherence (especially runtime caching).
5.  **Refine Memory Bank:** Updated all core files based on initial assessment and user feedback.
6.  **Formulate Recommendations & Questions:** Presented findings and questions to the user. Received clarifications on priorities (Offline > Payments), coaching notes (manual admin entry), and chat (external platform).

## Active Decisions & Considerations

- Prioritizing PWA offline improvements based on user feedback.
- Deferring work on Payments/Subscription integration.
- Noting requirements for future tasks: Admin UI for coaching notes, integration with external chat platform.
- Acknowledging existing technical debt/areas for improvement (coupling, state complexity, layout calculation, etc.) to potentially address later.
