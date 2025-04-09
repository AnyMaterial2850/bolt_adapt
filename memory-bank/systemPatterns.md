# System Patterns: bolt_adapt

## Architecture Overview

- **Frontend:** React (Vite) PWA using TypeScript. Client-side routing with React Router DOM. Styling via Tailwind CSS. Global state managed partly by Zustand. PWA capabilities via custom Service Worker (`injectManifest` strategy with Workbox precaching).
- **Backend:** Supabase handles Authentication and Database (Postgres). Likely uses Supabase Functions for push notifications (`createNotification` function exists). RLS usage TBC.
- **State Management:** Zustand is used for Authentication (`authStore`) and global UI state (`appStore`). Feature-specific state management TBC (could be local state, prop drilling, or other Zustand stores).
- **Routing:** Centralized routing defined in `App.tsx`, protecting routes based on auth state and `user.is_admin` flag. Shared layout component (`Layout.tsx`) for main app sections.

## Key Technical Decisions

- **Vite:** Chosen for frontend tooling (fast builds, dev server).
- **React + TypeScript:** Standard choice for type-safe UI development.
- **Supabase:** Leveraged as a BaaS for core backend features.
- **Zustand:** Selected for global state management (lightweight compared to Redux).
- **Tailwind CSS:** Utility-first CSS framework.
- **Custom Service Worker (`injectManifest`):** Allows for specific PWA caching/notification logic, but current implementation lacks runtime caching and robust lifecycle management.
- **Manual SW Registration:** Service worker registration handled in `main.tsx` via `sw-reg.ts`.
- **Generated DB Types:** Supabase CLI used to generate TypeScript types for database interactions (`src/types/database.ts`).

## Component Structure

- **Pages:** Located in `src/pages/`, organized by feature (auth, admin, habits, Profile).
- **Components:** Located in `src/components/`, organized by feature (admin, chat, habits, plan, profile, shared, ui, video).
- **UI Primitives:** A `src/components/ui/` directory suggests common reusable UI elements (Button, Input, Modal, Tabs, etc.).
- **Layout:** `Layout.tsx` provides the main authenticated shell with header, outlet, and bottom nav.
- **Stores:** Zustand stores in `src/stores/`.
- **Libs:** Utility functions, Supabase client, SW registration in `src/lib/`.

## Data Flow

- **Auth:** `App.tsx` -> `authStore.loadUser()` -> Supabase Auth -> `authStore` state update -> Components re-render based on `user`. Sign-in/up flows: Component -> `authStore` action -> Supabase Auth/DB -> `authStore` state update.
- **Profile:** Profile data loaded into `authStore` alongside auth state. Updates likely go Component -> Supabase DB -> Potentially manual update of `authStore` or re-fetch.
- **Habits/Other Features:** TBC. Likely involves components fetching data directly from Supabase or via dedicated Zustand stores, triggered by user actions or route changes.
- **Global UI State:** Components read/write to `appStore` (e.g., `Layout` reads/writes `activeTab`, components with forms might set `hasUnsavedChanges`).
