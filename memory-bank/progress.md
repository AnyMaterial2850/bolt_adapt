# Progress: bolt_adapt

## Current Status (Post-Initial Assessment)

- **Overall:** Application is a partially functional PWA with core features implemented (Auth, Habit CRUD, Profile CRUD, Admin Habit Mgmt). Key areas like Payments/Subscriptions and robust PWA offline capabilities are incomplete.
- **Technology:** Confirmed stack: React, Vite, TS, Supabase (Auth, DB, Functions, Storage), Zustand, React Router, Tailwind.
- **PWA:** Basic precaching via Workbox and push notification handling implemented. Lacks runtime caching and full SW lifecycle management.
- **Database:** Schema defined via migrations and types generated. Includes tables for profiles, habits, user_habits, habit_images, weight_entries, habit_comp_track, chat_messages. Uses JSON extensively for flexible fields. `subscriptions` table likely exists but missing from generated types.

## What Works (Based on Code Review)

- User Authentication (Sign In/Up, Password Change).
- Profile Management (Personal details, Weight tracking).
- Global Habit Management (Admin CRUD interface with image uploads).
- User Habit Tracking (Linking habits to users, marking completions).
- Basic PWA setup (Manifest, SW registration, precaching, push handling).
- Core routing and layout structure.
- Admin section guard (`is_admin` flag).

## What's Left to Build/Implement

- **PWA Runtime Caching (High Priority):** Service worker needs strategies to cache API calls (Supabase data) and potentially other assets for better offline support.
- **PWA Update Flow:** Service worker needs proper activation logic (skipWaiting, clients.claim, cache cleanup) for seamless updates.
- **Coaching Notes Admin UI:** Requires extending the admin interface to allow manual entry of coaching notes per user. (Current display logic in `Home.tsx` needs updating too).
- **Chat Feature Integration:** Requires integration with the specified external chat platform. Existing `ChatMessage` table purpose TBC.
- **Subscription/Payment (Deferred):** Placeholder components exist, but Stripe integration is planned for later.
- **Testing:** Test setup exists, but actual test coverage and effectiveness were not assessed.
- **Error Reporting:** Production-grade error reporting (e.g., Sentry) is not implemented.

## Known Issues / Areas of Concern (From Assessment)

- **PWA Offline Capability (High Priority):** Limited due to lack of runtime caching in the service worker.
- **Tight Coupling:** Core libs (`supabase.ts`, `authStore.ts`) depend directly on `debugStore`.
- **State Management Complexity:** State is spread across Zustand stores and local state; could potentially be streamlined, especially in `Home.tsx`.
- **Layout Calculation:** Dynamic header padding calculation in `Layout.tsx` is brittle.
- **Database Schema:** Use of parallel arrays (`go_deeper_*`) in `habits` table is not ideal. `subscriptions` table missing from generated types. `habit_comp_track` vs `HabitCompletion` naming inconsistency. Cascade delete reliance needs confirmation.
- **Time Handling:** Conversion needed between UI time format and DB `evt_time` format.
- **Push Notifications:** VAPID keys seem unconfigured in the Supabase function; potential lack of authorization checks in the function.
- **Error Handling Consistency:** Varies between setting local error state, using toasts, and potentially relying on `ErrorBoundary`.

*(This file will be updated as development continues.)*
