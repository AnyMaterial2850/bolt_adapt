# Technical Context: bolt_adapt

## Technologies Used

- **Framework:** React 18+
- **Bundler/Dev Server:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, clsx, tailwind-merge
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Postgres DB, Functions - `createNotification` confirmed)
- **Icons:** Lucide React, Iconify
- **Testing:** Vitest, React Testing Library, happy-dom (for DOM environment in tests)
- **Linting/Formatting:** ESLint (Configured via `eslint.config.js`), TypeScript ESLint plugin. (Prettier not explicitly listed but common with Tailwind).
- **PWA:** vite-plugin-pwa (injectManifest strategy), custom `service-worker.js` using Workbox precaching.

## Development Setup

- **Package Manager:** npm (confirmed by `package-lock.json`)
- **Scripts:** `dev`, `build`, `lint`, `preview`, `test`, `test:coverage` (defined in `package.json`)
- **Environment Variables:** Uses `.env` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Dev Server:** Vite dev server on port 5173.

## Technical Constraints

- **Offline Capability:** Basic precaching exists, but runtime caching for dynamic data (API calls) is missing, limiting offline functionality.
- **PWA:** Must adhere to PWA installability criteria.
- **Responsiveness:** Target web and mobile.

## Dependencies & Integrations

- **Supabase:** Core backend service. Uses Auth, Database (public schema, `profiles` table confirmed, others TBC via migrations), Functions (`createNotification`). RLS usage TBC. Storage usage TBC.
- **date-fns:** For date manipulation.
- **canvas-confetti:** For visual effects (likely on habit completion?).
- **External APIs:** None identified yet beyond Supabase.

## Build & Deployment

- **Build Tool:** Vite, configured with manual vendor chunking and minification via Terser (dropping console/debugger logs in production).
- **Deployment:** Vercel is used as the deployment platform. Project is linked to Vercel as evidenced by the `.vercel` directory.
