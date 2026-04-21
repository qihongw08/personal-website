# Personal Website — Agent Guide

Production port of a Claude Design handoff. Next.js 15 (App Router) on Vercel, pulling live data from GitHub and embedding Spotify.

> **Before any design decision** (new color, spacing, typography, component pattern, motion), consult [DESIGN.md](./DESIGN.md). It's the single source of truth for visual tokens and UI patterns. If a need arises that isn't covered, extend DESIGN.md in the same PR.

## Stack
- **Next.js 15** App Router, **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** with design tokens in `app/globals.css` as CSS variables
- **shadcn/ui** component primitives live in `components/ui/` — add via `bunx shadcn@latest add <name>`
- **Framer Motion** (`motion/react`) for DOM-level animation; raw `<canvas>` + `requestAnimationFrame` for FriendsGraph
- **Octokit** (REST + GraphQL) for GitHub data; **zod** validates env
- **Bun** for install + local scripts: `bun run dev`, `bun run build`, `bunx tsc --noEmit`

## Single Source of Truth

Every user-visible string, number, or photo path lives in `content/*.ts`:

| File | What it controls |
|---|---|
| `content/profile.ts` | Name, tagline, bio, education, skills, socials, profile photo, resume path |
| `content/experience.ts` | Career timeline entries |
| `content/projects.ts` | 4 featured projects + their GitHub source (single repo or aggregated org) |
| `content/achievements.ts` | HackMIT, Dean's List, etc. |
| `content/hobbies.ts` | Badminton / Hiking / EDM copy + photo labels |
| `content/friends.ts` | Friend names + tag mapping for the graph |
| `content/song.ts` | Spotify track ID for the embed |

**Never hardcode user-visible data in a component.** If you find yourself typing Qihong's GPA, email, or a tag, check `content/` first and add/edit it there.

## Design Tokens

CSS variables in `app/globals.css`:
- Brand: `--brand` (#0891b2), `--brand-purple` (#7c3aed)
- Surface: `--surface`, `--glass-bg`, `--glass-bg-hover`, `--glass-border`, `--glass-border-hover`
- Ink: `--ink`, `--ink-muted`, `--ink-faint`
- Fonts: `--font-display` (Space Grotesk), `--font-body` (DM Sans), `--font-mono` (Geist Mono)

shadcn's own tokens (`--primary`, `--accent`, `--card`, etc.) are kept intact so shadcn primitives render correctly. When restyling a shadcn component, prefer passing `className` — do not fork the primitive.

## Server vs Client

- **Default to Server Components.** `"use client"` only when a component uses state, effects, refs, canvas, or browser-only APIs.
- Current client components: `Navigation`, `Hero`, `Terminal`, `Career`, `FriendsGraph`, `MediaViewer`, `RankHistoryTable`, `FadeInWhenVisible`, `UnregisterServiceWorker`.
- `CommitGraph`, `Projects`, `About`, `Hobbies`, `Friends` (the container) are Server Components so GitHub fetches and Spotify markup render without shipping a token or extra JS.

## GitHub Data

`lib/github.ts` exposes three helpers:
- `getRepoStats(owner, repo)` — single-repo stars + commit count + last push
- `getAggregateStats(repos[])` — sums stars/commits across a list (used for Shuttleverse's 6 microservices and Karp's 3 repos)
- `getContributions(username)` — 53-week daily contribution heatmap via GraphQL

All three fail open: they return zeros / synthetic data if `GITHUB_TOKEN` is missing or a call errors out, so the site still renders.

`app/page.tsx` sets `export const revalidate = 3600` → Vercel re-renders hourly via ISR.

## Secrets

- `GITHUB_TOKEN` — PAT with `public_repo` scope; set in `.env.local` for dev and in Vercel's project settings for prod
- `GITHUB_USERNAME` — defaults to `qihongw08`
- **Never use `NEXT_PUBLIC_*` prefix for the token** — it would leak into the client bundle.

## Animation Rules

- **DOM animation → Framer Motion.** Wrap reveal animations in `FadeInWhenVisible` (in `components/shared/`). Use `motion.*` elements with `whileInView={{...}}` + `viewport={{ once: true }}` for one-shot reveals.
- **Per-pixel → canvas.** `FriendsGraph` uses raw `requestAnimationFrame` and gates on `prefers-reduced-motion: reduce`.
- **CSS keyframes** are fine for simple, always-on effects (floating orbs in Hero, pulsing LIVE indicator).

## Styling Rules

- Tailwind utility classes > inline styles > CSS-in-JS (banned).
- Inline `style={{...}}` only for (a) dynamic per-instance values (rotation, transform driven by JS) or (b) custom CSS-variable references the JIT can't see at build (`style={{ color: "var(--brand)" }}` is fine).
- No `any` in app code. No JSDoc. No file-header banners.
- Comments only when the *why* is non-obvious.

## When Adding a Section

1. Create `components/<section>/<Section>.tsx` (Server Component by default)
2. Add its data to a new `content/<section>.ts` file if it has editable content
3. Register it in `app/page.tsx`
4. Add the section id to `NAV_SECTIONS` in `components/Navigation.tsx`

## Commands

```bash
bun run dev        # local dev on :3000
bun run build      # production build
bun run start      # production server
bunx tsc --noEmit  # type-check
bun run lint       # eslint
```
