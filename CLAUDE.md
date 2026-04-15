# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # TypeScript check + production build
npm run preview   # Serve the production build locally
```

No test runner is configured.

## Stack

- **Vite + React 18 + TypeScript 5.5**
- **TailwindCSS 3** for styling — custom tokens defined in `tailwind.config.js` and mirrored as CSS variables in `src/index.css`
- **React Router v6** — `BrowserRouter` in `App.tsx`, four routes: `/`, `/browse`, `/login`, `/register`

## Color Palette

All colors come from the custom Tailwind theme. Never use arbitrary hex values — use the tokens:

| Token | Value | Usage |
|---|---|---|
| `navy` | `#141925` | Hero/CTA backgrounds, primary dark |
| `navy-mid` | `#1C2535` | Elevated dark surfaces |
| `navy-light` | `#243045` | Borders on dark |
| `gold` | `#A8823A` | Accents, section labels |
| `gold-light` | `#C9A560` | Hover states on gold |
| `teal` | `#1B5C5C` | Secondary accent |
| `cream` | `#F2EBE0` | Light section backgrounds |
| `cream-dim` | `#E9E0D4` | Alternate light backgrounds |
| `warm-white` | `#F8F4EE` | Body default |
| `stone` | `#8A7E72` | Muted text |

Avoid white (`#fff`) backgrounds — all surfaces should stay within the warm cream/navy palette.

## Typography

Two font families loaded via Google Fonts in `index.html`:
- `font-display` → `Fraunces` (serif) — headlines, wordmark
- `font-sans` → `DM Sans` — body/UI text

## Architecture

```
src/
  types/index.ts        # Shared TypeScript types: UserRole, YachtJob, CrewMember, TabType
  data/mockData.ts      # Mock YachtJob[] and CrewMember[] — replace with API calls later
  components/
    Navbar.tsx          # Fixed nav, changes color based on scroll/page
    Footer.tsx
    HelmWheel.tsx       # Interactive SVG ship's wheel with drag physics (see below)
    LoadingScreen.tsx   # Animated sailboat splash screen (see below)
    JobCard.tsx         # Card for YachtJob
    CrewCard.tsx        # Card for CrewMember
  pages/
    Home.tsx            # Landing: hero, orbit section, how-it-works, recent positions, CTA
    Browse.tsx          # Dual-tab (jobs/crew) search + filter, reads ?tab= URL param
    Login.tsx           # Split layout login form
    Register.tsx        # Two-step registration (role select → account details), reads ?role= param
```

## Key Components

### HelmWheel (`src/components/HelmWheel.tsx`)

Interactive SVG ship's wheel. Drag-spins with momentum physics. Two variants:
- `variant="dark"` — cream strokes on dark background (default)
- `variant="light"` — navy strokes on light background

Accepts `angleRef?: React.MutableRefObject<number>` — writes the current rotation angle every RAF frame so sibling components can read it without React re-renders. Used by Home.tsx's `OrbitSection` to position the orbiting feature cards.

### LoadingScreen (`src/components/LoadingScreen.tsx`)

Four-phase animation on first page load:
1. **drawing** (0–1.7s): Dark overlay covers page, sailboat SVG paths draw in via stroke animation
2. **sailing** (1.7–2.9s): Overlay fades, page appears, boat scales down (→0.48) and travels to lower-right of viewport
3. **docked** (2.9–4.4s): Boat bobs subtly, remains visible as a watermark
4. **gone** (4.4s+): Boat fades out, `onUnmount()` fires to remove component

Callbacks:
- `onPageReveal()` — called at 1.7s when overlay fades (used to show the page)
- `onUnmount()` — called at 4.4s (used to remove LoadingScreen from the tree)

### Scroll Reveal

Elements animated on scroll use the `.reveal` / `.reveal.visible` CSS classes in `index.css`. Add `reveal-d1` through `reveal-d4` for staggered delays. A `useEffect` in each page sets up an `IntersectionObserver` to add the `visible` class.

## Backend (FastAPI)

The backend will be built with **FastAPI** (Python). When wiring up API calls in the frontend:

- Base URL should come from an env variable (`VITE_API_URL`) so it can point to `http://localhost:8000` in dev and the production host in prod.
- All requests should use `fetch` (or a thin wrapper) with `Content-Type: application/json`.
- Auth will use **JWT bearer tokens** — store the token in memory or `localStorage` and attach it as `Authorization: Bearer <token>` on authenticated requests.
- FastAPI returns validation errors as `{ detail: [...] }` — handle this shape when displaying form errors.
- The mock data in `src/data/mockData.ts` maps directly to the `YachtJob` and `CrewMember` interfaces; these interfaces should stay in sync with the FastAPI Pydantic schemas.

## Design Tone

The platform targets high-net-worth yacht owners and professional maritime crew. Keep the aesthetic **serious, restrained, and professional** — no sparkles, particles, or playful animations. Subtle motion (slow rotation, gentle floating) is appropriate; anything flashy is not.
