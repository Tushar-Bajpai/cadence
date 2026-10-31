<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CodeLifters — Cadence Subscription Management System

## 1. Project Overview
Cadence is an enterprise subscription lifecycle and automated invoicing platform built by **CodeLifters** with **Next.js 16 (App Router)** and **Tailwind CSS**.
The application presents an editorial showcase and portal for the Cadence automated billing engine, featuring full-viewport horizontal spread transitions, an interactive guide mascot (Jelly), and an enterprise design system.

---

## 2. Architecture & File Structure

```
├── app/
│   ├── page.tsx                  # Main magazine viewport orchestrating page navigation
│   ├── globals.css               # Editorial typography, grain shaders, gradients & keyframes
│   ├── layout.tsx                # Root layout & font configurations
│   └── auth/page.tsx             # Authentication portal (Google OAuth, email/password, RBAC demo access)
├── components/
│   ├── jelly-guide.tsx           # Interactive Jelly mascot guide (SVG, eye tracking, position snapping)
│   ├── magazine-header.tsx       # Masthead navigation header with mobile drawer
│   ├── magazine-index.tsx        # Vertical page index indicator
│   └── sections/
│       ├── cover-section.tsx     # Spread 0: Overview / Hero ("Recurring billing. Zero missed cycles.")
│       ├── story-section.tsx     # Spread 1: The Engine ("The heartbeat of recurring revenue. Never billed twice.")
│       ├── field-notes-section.tsx # Spread 2: System Modules (Lifecycle, Invoicing, Analytics 3-card grid)
│       └── contact-section.tsx   # Spread 3: Project Showcase (Connect with CodeLifters & Acceptance Checklist)
├── hooks/
│   └── use-page-turn.ts          # Page-turn gesture controller (wheel, swipe, keyboard)
├── constants/
│   └── magazine.ts               # Page registry, duration, and thresholds
└── types/
    └── magazine.ts               # Core type definitions
```

---

## 3. Design System & Branding Guidelines

- **Team Name**: Always **`CodeLifters`** (capital C, capital L). Never use legacy names or Web3/crypto references.
- **Signature Accent Color**: `#8978ff` (wisteria violet) matching the headline italic `wild.`.
  - Base: `#8978ff`
  - Hover: `#9b8cff`
  - Glow / Shadow: `rgba(137, 120, 255, 0.4)`
- **Typography**:
  - Headings: Editorial italic serifs (`h1 em, h2 em`) set in `#8978ff`.
  - Body: Clean modern sans-serif with high contrast white/light violet tones.
  - Eyebrows & Colophon: Monospace uppercase tracking (`font-mono text-xs uppercase tracking-[0.2em]`).
- **Iconography**:
  - Official brand icons: `react-icons` (`FcGoogle` from `react-icons/fc`, `SiGithub` & `SiVercel` from `react-icons/si`).
  - UI icons: `lucide-react` (`ArrowRight`, `ArrowUpRight`, `Check`, `Copy`, `Sparkles`, `Eye`, `EyeOff`, etc.).
- **Strict Editorial Cleanliness (No Random Cards)**:
  - Never add unsolicited cards, benchmark specimens, checklist cards, demo credential boxes, or info pills.
  - Spreads must remain open, spacious, and editorial without filling negative space with artificial widgets.

---

## 4. Companion Mascot Guidelines (`JellyGuide`)

- **Design**: Plump, organic gumdrop silhouette rendered purely in inline SVG with soft 3D lighting.
- **Behaviors**:
  - **Full-Viewport Eye Tracking**: Eyes smoothly track the cursor across the entire viewport using `Math.atan2` with zero distance cutoff.
  - **Natural Blinking**: Procedural blinking timer with happy curved anime eyes.
  - **Target Snapping**: Smoothly glides to the active section's primary interactive CTA button on each page turn.
- **Constraints**:
  - **Hidden on Mobile**: Visible only on tablet and desktop screens (`≥ 768px`) via `hidden md:block` to keep mobile screens uncluttered and touch-friendly.
  - **No arrows or floating pointer dots** around Jelly. Keep the silhouette clean and organic.
  - **No intrusive dance routines or audio synthesizers**. Jelly floats calmly with gentle organic bobbing (`@keyframes float-jelly`).

---

## 5. Responsive Design Rules (Strict Requirement)

- **Always Mobile Responsive**: Every section, spread, typography element, button, and card **must remain fully responsive** across all viewport sizes (from 360px mobile screens up to ultrawide displays).
- **No Gesture Conflicts**: Never use horizontal scrolling containers (`overflow-x-auto`) on mobile spreads, as horizontal swipes interfere with the global magazine page-turn gesture controller (`usePageTurn`).
- **Viewport Height Safety (`100dvh`)**: Mobile spreads must fit comfortably within vertical height constraints (`100dvh`) without clipping headers or colophons. Use compact vertical stacking on mobile (`grid-cols-1`) and multi-column grids on desktop (`md:grid-cols-3` / `lg:grid-cols-12`).
- **Touch-Friendly Targets**: Maintain comfortable touch target sizes (minimum 40px) with generous tap padding for mobile buttons and navigation pills.

---

## 6. Development & Build Rules

1. **Always Use the `--webpack` Flag**:
   In macOS environments, Turbopack may encounter IPC socket issues. Always run Next.js with `--webpack`:
   ```bash
   # Development server
   npm run dev -- -p 8000
   # or
   npx next dev --webpack -p 8000

   # Production build
   npx next build --webpack
   ```

2. **Type Checking**:
   Always verify code changes with TypeScript:
   ```bash
   npx tsc --noEmit
   ```

3. **Preserve `AGENTS.md` Header**:
   Always keep the `<!-- BEGIN:nextjs-agent-rules -->` block intact at the top of this file, as it is managed by Next.js.

---

## 7. Problem Statement Integration & Hackathon Alignment

- **Problem Statement Alignment**:
  Website copy, specifications, and architecture references are aligned with the **Cadence Subscription Management System** (`BUILD_PLAN.md`):
  - Idempotent invoicing runs with zero duplicate billing guarantee (`@@unique([subscriptionId, periodStart])`).
  - Deterministic subscription lifecycle state machine (`Draft → Quotation → Confirmed → Active → Closed`).
  - Dynamic multi-tier tax and auto-expiring discount rule engines.
  - Multi-role RBAC (Admin, Staff, Customer) and self-service portals.
  - Sub-2s query latency benchmarked on 5,000+ seeded records.
