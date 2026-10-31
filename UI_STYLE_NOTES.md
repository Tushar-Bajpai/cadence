# UI Style Notes — Brightloop / Cadence Design Language

Extracted from the existing landing page (`app/page.tsx`, `app/globals.css`,
`components/sections/*`, `components/auth-shell.tsx`, `components/jelly-guide.tsx`).
The app (admin/portal) consumes these as tokens/classes; **the landing page itself
must never be modified to match the app — the app matches the landing.**

## 1. Colors

| Token | Value | Where seen |
|---|---|---|
| App void (bg) | `#05051a` | `hero`, `closing-section`, auth shell, admin/portal pages |
| Deep slab | `#090733` / `#15106a` / `#2f24c1` / `#27208e` | hero gradient bands |
| Brand violet (primary/accent) | `#8978ff` | `h1 em`, `h2 em`, headline italic |
| Brand violet hover | `#9b8cff` | `.eyebrow`, hover states |
| Glow / shadow | `rgba(137,120,255,.4)` (0.2–0.4) | glass card hover glow |
| Soft violet text | `#9b8cff` / `#a79aff` | `.eyebrow`, `.kicker |
| Foreground | `#fff` / `rgba(245,241,255,.62)` | body text, muted colophon |
| Hairline border | `rgba(255,255,255,.10–.16)` | glass cards, footer rule |
| Semantic | success `#34d399` · warning `#fbbf24` · danger `#f87171` (`--destructive` token) | status colors |

Gradient recipes (copy-paste):
```
Ambient void:  radial-gradient(circle at 50% 15%, rgba(92,75,255,.4), transparent 45%),
               radial-gradient(circle at 80% 80%, rgba(65,45,190,.25), transparent 50%)
Violet glass:  linear-gradient(145deg, rgba(102,80,238,.38) 0%, rgba(18,14,45,.8) 100%)
```

## 2. Surfaces
- **Glass card** `.world-glass-card`: `rounded-2xl border-white/10 backdrop-blur-[18px]`,
  hover lifts `translateY(-8px)` (md+), shadow `0 20px 40px rgba(0,0,0,.45)`,
  violet glow, diagonal sheen sweep (::after translate).
- **Ink glass** `.world-glass-ink`, **violet glass** `.world-glass-violet` for tinted variants.
- App (admin/portal) pages wrap content in a `.dark` context so shadcn tokens render dark,
  and use `bg-[#05051a] text-white` like the existing auth/admin pages.

## 3. Typography
- Base: Arial/Helvetica; html font-size `clamp(12.5px, .85vw + 3px, 14.5px)`.
- H1/H2: `font-weight 400`, `letter-spacing -.085em`, `line-height .84`.
- `h1 em / h2 em`: Georgia italic, `#8978ff` (the editorial "italic accent" trick).
- UI chrome: `font-mono text-[10–11px] uppercase tracking-[.18–.25em] text-white/40–60`.
- Body copy: `text-sm` (≈ `.85rem`), leading-relaxed, `text-white/55–70`.

## 4. Radii & spacing rhythm
- Radius scale from `--radius: 0.625rem` (`rounded-lg` base, `rounded-xl/2xl/3xl`).
- Sections breathe: `py-24+` desktop, `py-12` mobile; cards `p-5/6`; gutters `5vw` full-bleed.
- Content max width ~`max-w-5xl` to `max-w-6xl` for text, full-viewport canvases elsewhere.

## 5. Motion language
- **Easing**: hero page-turns use `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out), 0.4–0.5s.
- **Durband durations**: micro (hover/borders) `.2–.35s ease`; entrances `.5–.75s`.
- **Entrance**: staggered fade+rise (`opacity 0→1`, `translateY 16px→0`) with per-index
  delays — reused app-wide as class `reveal` + `[animation-delay:…]`.
- **Hover lift**: cards `-translate-y-1` + violet glow shadow; links underline-grow or
  arrow nudge (`group-hover:translate-x-1`, `.round-link:hover svg { translate(4px,-4px) }`).
- Sheen sweep on glass cards (hover, `.75s`).
- No framer-motion in the project → motion is pure CSS (tailwind `animate-*` +
  custom keyframes). `prefers-reduced-motion` must disable entrance/lift/bob animations.
- Animations available app-wide: `reveal-up`, `reveal-fade`, `float-jelly`, `pulse-dot`
  (see globals.css), plus `tw-animate-css` for `data-open:` dialog/drawer transitions.

## 6. Component conventions (baseline = shadcn `base-nova` on `@base-ui/react`)
- Buttons: pill-ish `rounded-lg`, `h-8` default; brand CTA = `bg-[#8978ff] text-white
  hover:bg-[#9b8cff]` with `shadow-[0_0_24px_rgba(137,120,255,.35)]`; secondary =
  `border-white/12 bg-white/[.04] text-white/85`; ghost/danger variants per toggling.
- Inputs/selects: `rounded-lg bg-white/[.04] border-white/12`, focus `ring-[#8978ff]/50`.
- Tables: hairline `border-white/8` rows, `text-xs` mono headers, hover `bg-white/[.03]`.
- Badges: `rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider`.
- Dialogs/drawers: centered popups, `data-open:animate-in fade/zoom`, dark surface.
- Focus rings: `focus-visible:ring-ring/50` (violet-tinted ring token).

## 7. Dark / light behavior
- Landing + auth are hard-coded dark canvases (`#05051a`).
- App pages explicitly add the `dark` class (adapter) so semantic tokens resolve dark
  regardless of OS setting → the whole product is a night-mode editorial UI.
- Light mode is not designed; do not rely on `light` tokens inside the app.

## 8. Tokens added for the app (globals.css, purely additive)
- `--brand: #8978ff`, `--brand-hover: #9b8cff`, `--brand-glow: rgba(137,120,255,.4)`,
  chart palette `--chart-brand-1..5`, status colors `--status-*`, plus keyframes
  `reveal-up`, `reveal-fade`, pulse; `.reveal`, `.brand-btn`, `.eyebrow-label`,
  `.card-surface`, print stylesheet for `/print` routes.

## 9. Do-not list
- Do not restyle the landing (sections/, magazine-*), do not add random info cards
  to spreads, never rename CodeLifters.
