# System Patterns: bolt_adapt

## Architecture Overview

- **Frontend:** React (Vite) PWA using TypeScript. Client-side routing with React Router DOM. Styling via Tailwind CSS. Global state managed by Zustand stores organized by domain. PWA capabilities via custom Service Worker (`injectManifest` strategy with Workbox precaching).
- **Backend:** Supabase handles Authentication and Database (Postgres). Uses Supabase Functions for push notifications (`createNotification` function exists).
- **State Management:** Domain-specific Zustand stores with clear separation of concerns. Each store follows consistent patterns for data loading, caching, and error handling.
- **Routing:** Centralized routing defined in `App.tsx`, protecting routes based on auth state and `user.is_admin` flag. Shared layout component (`Layout.tsx`) for main app sections.

## Key Technical Decisions

- **Vite:** Chosen for frontend tooling (fast builds, dev server).
- **React + TypeScript:** Standard choice for type-safe UI development.
- **Supabase:** Leveraged as a BaaS for core backend features.
- **Zustand:** Selected for global state management (lightweight compared to Redux).
- **Tailwind CSS:** Utility-first CSS framework.
- **Custom Service Worker (`injectManifest`):** Allows for specific PWA caching/notification logic.
- **Manual SW Registration:** Service worker registration handled in `main.tsx` via `sw-reg.ts`.
- **Generated DB Types:** Supabase CLI used to generate TypeScript types for database interactions (`src/types/database.ts`).

## Architectural Principles

Following a comprehensive review of the codebase, we've established these core architectural principles:

### 1. Separation of Concerns

- **Container/Presentation Pattern:** Container components own data fetching and state management, presentation components are pure renderers
- **Example:** `Home.tsx` is a container that loads data, `PlanTab.tsx` is a presentation component that renders that data
- **Principle:** All components should have a single responsibility - either managing data or displaying it, not both

### 2. Smart Caching Strategy

- **Cache Invalidation:** All stores implement proper cache invalidation with timestamps and tracking of loaded data
- **Throttling:** Data fetching is throttled to prevent rapid successive calls to the same endpoint
- **Example:** `completionStore.ts` tracks last loaded habit IDs and dates to prevent redundant API calls

### 3. Single Source of Truth

- **Domain-Specific Stores:** Each domain has one store responsible for its data (habits, completions, auth, etc.)
- **Centralized Loading:** Container components are the only ones that trigger data loading
- **Example:** Only `Home.tsx` calls `loadCompletions()`, ensuring a single data loading source

### 4. Proper React Hook Management

- **Dependency Arrays:** useEffect dependencies are carefully managed to prevent infinite loops
- **Memoization:** useMemo and useCallback are used for expensive calculations and event handlers
- **Example:** Complex data transformations are wrapped in useMemo with appropriate dependencies

### 5. Error Recovery and Resilience

- **Graceful Degradation:** All components have fallback UI for error states
- **Consistent Error Handling:** Errors are caught, logged, and displayed consistently
- **Example:** Network errors during data fetching show appropriate user feedback

## Component Structure

- **Pages:** Located in `src/pages/`, organized by feature (auth, admin, habits, Profile). Act as containers.
- **Components:** Located in `src/components/`, organized by feature (admin, chat, habits, plan, profile, shared, ui, video). Primarily presentation components.
- **UI Primitives:** A `src/components/ui/` directory contains common reusable UI elements (Button, Input, Modal, Tabs, etc.).
- **Layout:** `Layout.tsx` provides the main authenticated shell with header, outlet, and bottom nav.
- **Stores:** Zustand stores in `src/stores/`, organized by domain with consistent patterns.
- **Libs:** Utility functions, Supabase client, SW registration in `src/lib/`.

## Data Flow

- **Auth:** `App.tsx` -> `authStore.loadUser()` -> Supabase Auth -> `authStore` state update -> Components re-render based on `user`. Sign-in/up flows: Component -> `authStore` action -> Supabase Auth/DB -> `authStore` state update.
- **Profile:** Profile data loaded into `authStore` alongside auth state. Updates flow Component -> `authStore` action -> Supabase DB -> `authStore` state update.
- **Habits:** Container component (e.g., `Home.tsx`) -> `habitStore` action -> Supabase DB -> `habitStore` state update -> Presentation components re-render based on habit data.
- **Completions:** `Home.tsx` -> `completionStore.loadCompletions()` -> Supabase DB -> `completionStore` state update -> `PlanTab` re-renders based on completion data.
- **Global UI State:** Components read/write to `appStore` (e.g., `Layout` reads/writes `activeTab`, components with forms might set `hasUnsavedChanges`).
