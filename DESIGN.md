# Design System

Source of truth for visual, interaction, and motion decisions across the site. Consult this before introducing new colors, spacing values, typography, or components. If a need arises that isn't covered here, add it to this doc in the same PR as the change.

---

## Principles

1. **Quiet, not loud.** The site is a resume artifact first. Design choices should frame the content, never upstage it.
2. **Functional motion only.** Animation exists to signal state change, guide attention, or reveal structure — never as decoration.
3. **One surface palette.** The whole site reads as one canvas: cream background, glass cards, cyan accents. Resist adding new background colors or card styles.
4. **Terminal + editorial.** Monospace for metadata / commands; display serif-feel sans for headings; humanist sans for body.
5. **Edit content, not components.** Visible text, numbers, and image paths live in `content/*.ts`. Visual tokens live in `app/globals.css`. Never hardcode either in a component.

---

## Color Tokens

All colors are defined as CSS custom properties in `app/globals.css`. Use token names — not raw hex — in components (`var(--brand)`, `text-[var(--ink)]`, etc.).

### Brand
| Token | Value | Role |
|---|---|---|
| `--brand` | `#0891b2` (cyan-600) | Primary accent: links, active states, highlights, graph strokes |
| `--brand-purple` | `#7c3aed` (violet-600) | Secondary accent for radial gradients, hobby category (EDM), graph edges |

### Surface
| Token | Value | Role |
|---|---|---|
| `--surface` | `#f8f7f4` | Page background (warm cream) |
| `--glass-bg` | `rgba(248,247,244,0.62)` | Card fill (liquid-glass, cream tint) |
| `--glass-bg-hover` | `rgba(248,247,244,0.78)` | Card hover fill |
| `--glass-border` | `rgba(255,255,255,0.55)` | Inner-highlight rim — bright, reads as glass edge |
| `--glass-border-hover` | `rgba(8,145,178,0.35)` | Card borders on hover — cyan tint |
| `--glass-highlight` | `rgba(255,255,255,0.6)` | Inset top-edge highlight in `box-shadow` |
| `--glass-shadow` | `0 8px 32px rgba(26,26,46,0.08), inset 0 1px 0 var(--glass-highlight)` | Combined outer shadow + inner highlight for liquid-glass depth |

### Ink (text)
| Token | Value | Role |
|---|---|---|
| `--ink` | `#1a1a2e` | Primary text: headings, emphasized body |
| `--ink-muted` | `rgba(26,26,46,0.72)` | Secondary text: body prose, descriptions |
| `--ink-faint` | `rgba(26,26,46,0.52)` | Tertiary text: captions, meta, placeholders |

### Status Palette
Used for project cards and state pills. Defined in `content/projects.ts`:
| Status | Color |
|---|---|
| Deployed | `#16a34a` (green-600) |
| Active | `#ca8a04` (amber-600) |
| Archived | `#6b7280` (gray-500) |

### shadcn Token Mapping
shadcn primitives read `--primary`, `--accent`, `--card`, etc. These are **aliased** to our tokens in `globals.css`:
- `--primary` → `var(--brand)`
- `--card-foreground` → `var(--ink)`
- `--border` → `var(--glass-border)`
- `--ring` → `var(--brand)`

**Never override shadcn's tokens directly** — they cascade. Adjust ours instead.

---

## Typography

Loaded via `next/font/google` in `app/layout.tsx`.

| Token | Family | Weight | Usage |
|---|---|---|---|
| `--font-display` | Space Grotesk | 500–700 | H1/H2/H3, numerics in stat cards, project/company names |
| `--font-body` | DM Sans | 400–500 | All prose, descriptions, labels |
| `--font-mono` | Geist Mono | 400–500 | Terminal, commands, timestamps, contribution graph labels, tags |

### Scale
Headings use `clamp()` for fluid scaling.

| Role | Size (clamp) | Weight | Tracking |
|---|---|---|---|
| Hero terminal name | `clamp(24px, 4vw, 36px)` | 700 | normal |
| Section header | `clamp(32px, 5vw, 48px)` | 700 | normal |
| Project name | `20px` | 700 | normal |
| Company / timeline role | `18px` | 700 | normal |
| Body prose | `16px` | 400 | normal |
| Description / secondary | `13px` | 400 | normal |
| Caption | `12px` | 400 | normal |
| Meta (mono) | `10px` | 500 | `1–2px` letter-spacing, UPPERCASE |
| Pill / tag (mono) | `10px` | 500 | `1px` letter-spacing |

### Line Height
- Prose: `1.7`
- Tight UI / captions: `1.5–1.6`
- Display headings: `1.15`

---

## Spacing Scale

Tailwind's default scale (4px base). Preferred increments for layout:
- Inside cards: `24px` (`p-6`)
- Between card internals: `10px` / `14px` / `20px`
- Section vertical padding: `pt-[140px] pb-[100px]`
- Section horizontal padding: `px-10` (40px)
- Max content width: `1100px` (via `max-w-[1100px] mx-auto`)
- Grid gaps: `12px` (projects, tight) / `16px` (hobbies, normal)

---

## Radii

| Token | Value | Usage |
|---|---|---|
| `--radius` | `0.75rem` (12px) | shadcn default base |
| `rounded-md` | 8px | Inner photo thumbnails |
| `rounded-lg` | 10px | Button / icon containers |
| `rounded-xl` | 12px | Cards, graph containers |
| `rounded-2xl` | 16px | Friends graph container |
| `rounded-full` | 9999px | Status dots, nav pills |

---

## Shadows & Depth

Lean on borders + background shifts for depth, not shadows. Shadow use cases:
- Terminal hero: `0 8px 40px rgba(0,0,0,0.06)` — signature anchor element
- Active status dot: `0 0 12px rgba(8,145,178,0.4)` — glow, not shadow

Do **not** add shadows to cards or buttons. Use border color and bg shift for hover states.

---

## Motion

See `CLAUDE.md` for the framework choice rationale. Quick rules:

### Framer Motion (`motion/react`)
Use for all DOM motion:
- Scroll reveals: `<FadeInWhenVisible>` wrapper (already in `components/shared/`)
- Hover transforms on interactive cards
- `AnimatePresence` for mount/unmount
- Scroll-linked state (Career timeline uses `useScroll` + manual calculations)

### Canvas
Use only for per-pixel effects:
- `FriendsGraph` (force-directed network)

Gate canvas animations on `prefers-reduced-motion`.

### Curves
- Reveal / settling: `cubic-bezier(0.16, 1, 0.3, 1)` (fast start, slow settle)
- Hover feedback: default Framer spring or `ease-out 0.2s`
- Scroll-linked: linear (physics should drive feel)

### Durations
- Micro (hover, focus): `150–250ms`
- Section reveal: `600–900ms`
- Orb floats / ambient: `8–10s`

Never animate opacity/transform separately where a single `whileInView` suffices.

---

## Component Patterns

### Glass Card (Liquid Glass)
The universal container. Use the `.glass-card` utility class (declared in `app/globals.css`) on any element that should read as a card.
```
background: var(--glass-bg)            // translucent cream, ~62%
border: 1px solid var(--glass-border)  // bright white highlight rim
backdrop-filter: blur(24px) saturate(1.4)
box-shadow: var(--glass-shadow)        // outer depth + inset top highlight
transition: 300ms on bg / border / shadow
hover: border → cyan-tinted, bg → ~78%
```
The backdrop blur is what makes text behind the card frost out — visually separating content from the guóhuà backdrop. Always compose with Tailwind classes for layout (`rounded-xl`, `p-6`, `flex`, etc.); never restate the fill/border/blur inline.

Also available: `<GlassCard>` React component in `components/shared/` which applies the class plus a default `rounded-xl`.

### Meta Pill (tag / status / category)
```
font: mono 10px
letter-spacing: 1px
text-transform: uppercase
padding: 3px 8px
border-radius: 4px
border: 1px solid var(--glass-border)
background: rgba(0,0,0,0.03)
```
Status pills color the text + dot using status palette. Tag pills use `--ink-muted`.

### Button
Prefer `shadcn/ui` `<Button>` with `variant="outline"` or `variant="ghost"` for secondary actions. For the hero-style dashed-underline link, use a raw `<a>` with:
```
border-bottom: 1px dashed rgba(8,145,178,0.3)
color: var(--brand)
```

### Section Header
Left-aligned title, display font, thin horizontal rule extending right.
Defined as `<SectionHeader>` in `components/shared/`.

### Section Layout
Every top-level section follows:
```tsx
<section id="..." className="mx-auto max-w-[1100px] px-10 pt-[140px] pb-[100px]">
  <FadeInWhenVisible>
    <SectionHeader title="..." />
    {/* content */}
  </FadeInWhenVisible>
</section>
```

---

## Background System

The site renders on a **continuous ink-wash (guóhuà) backdrop**, not on a solid surface with per-section treatments. This matters for layering decisions, so everything here is load-bearing.

### Component
[`components/shared/GuohuaBackground.tsx`](components/shared/GuohuaBackground.tsx) — server-rendered. Uses a public-domain high-res scan of **Huang Gongwang's "Dwelling in the Fuchun Mountains"** (1350, Yuan dynasty; via Wikimedia Commons) stored at `public/backgrounds/guohua.jpg`. Mounted **once** in [`app/layout.tsx`](app/layout.tsx) as a sibling to the children wrapper.

### Positioning model
- The background wrapper is `position: fixed; inset: 0; z-index: 0; pointer-events: none`. It stays in place while the page scrolls — that's what makes the landscape read as continuous across sections.
- All content sits inside `<div class="relative z-10">{children}</div>`. Sections don't need any z-index of their own to clear the background.
- **Rule**: never introduce another `position: fixed` layer with `z-index: 0`. If you need a global overlay (a scroll-tracking bar, etc.), use a different z-index range (`z-[30]+`) and live above the content.

### Composition (back → front)
1. **Painting** — `next/image` with `fill` + `object-cover`, `opacity: 0.35`
2. **Cream wash overlay** — vertical gradient `rgba(248,247,244,0.55 → 0.35 → 0.55)` lifts overall luminance for text legibility
3. **Vignette** — radial gradient biasing the cream toward the viewport edges so section headers and the footer read cleanly

Opacity + overlay are tuned so the painting reads as atmosphere, not a photograph.

### Rules
- **Don't add** decorative fixed-position elements (gradients, orbs) to individual sections without coordinating with this layer.
- **Don't raise** card opacity below ~0.85 on surfaces where the background would peek through and hurt legibility (e.g., Career timeline cards use `rgba(248,247,244,0.9)` + backdrop-blur).
- **Replacing or restyling** the backdrop means editing `GuohuaBackground.tsx` only. It's the single source of truth for the artwork.
- The guóhuà is **static**. If we ever add drift, gate it on `prefers-reduced-motion: reduce`.

---

## Accessibility

- All text must meet WCAG AA against `--surface`. `--ink-faint` (0.3 alpha) is at floor — use only for non-essential decorative text.
- Canvas animations (`FriendsGraph`) must respect `prefers-reduced-motion: reduce`.
- Focus rings: `--ring` via `outline-ring/50` Tailwind utility. Never `outline: none`.
- Alt text on every `<Image>`. Empty `alt=""` on decorative SVG / canvas with `aria-hidden`.
- Terminal input is labeled via `aria-label`.
- Tab order matches reading order; no `tabindex` above 0.

---

## Writing Voice

- **Second person sparingly** — this is a portfolio, not marketing copy.
- **Numerics: signal concreteness.** "1.2M+ documents", "60% efficiency" > "many", "significantly".
- **No exclamation marks.**
- **Terminal commands are lowercase** unless referencing an env var (`$NAME_EN`).
- **Headings in Title Case**, body in sentence case.

---

## Friend Graph

Reusable, package-ready component at `components/friend-graph/`. Generic over a string-literal tag union so callers get compile-time tag safety: `<FriendGraph<"college" | "work">>`.

**Layout**
- Root node centered in a 1600×900 viewBox, auto-connected to every cluster.
- Friends grouped by their sorted tag signature — friends with identical tag sets form one cluster; multi-tag friends form singleton clusters.
- Clusters distributed on an ellipse (Rx 360–460, Ry 200–280) around the root.

**Visual**
- Cluster frame: dashed `6 5` stroke, 16px corner radius, tag-tinted at `55` alpha (fill at `0a`).
- Cluster label: uppercase tag label(s) joined by ` · ` in Geist Mono, 11px, 1.5px tracking, tag color.
- Friend tile: 120×140, glass-card surface, rounded 14px, 52px avatar + name (Space Grotesk 12/600) + optional headline (Geist Mono 9/600, uppercase).
- Root tile: 160×180, 72px avatar, double-layer shadow with brand-cyan glow.
- Root edges: dashed `5 6` stroke in `--brand` at 45% opacity.
- Bridge edges (clusters sharing a tag): dashed `3 6` stroke in `--ink-faint` at 35% opacity.

**Motion**
- Static layout — positions are deterministic (friends sorted by `id` before clustering to keep SSR output stable).
- Staggered reveal (0.08s per cluster) on scroll via `whileInView` with fade + subtle scale.
- Hover lifts a tile by 3px with a tag-tinted glow; `useReducedMotion` collapses to instant state.

**Interaction**
- Scroll-wheel zoom (0.3×–3×) centered on the cursor; cancels page scroll while over the SVG.
- Click-and-drag anywhere on empty canvas to pan. Pointer capture keeps the gesture alive outside the SVG bounds. Interactive targets (buttons, links) opt out of pan so clicks still work.
- Cursor toggles between `grab` and `grabbing`; `touch-action: none` enables smooth trackpad pan on touch devices.

**Portability**
- No imports from `content/*` or `lib/*`. Colors fall back to hex when CSS vars are absent (`var(--brand, #0891b2)`), so the component works outside this site.
- Images use plain `<img loading="lazy">` inside `<foreignObject>` — no Next.js coupling. When extracting to npm, the only dependency is `motion/react`.

---

## When to Extend

If the design calls for something not in this document:

1. Check whether an existing token / pattern almost fits — reuse.
2. If you need a new token, add it to `:root` in `globals.css` and document here in the same commit.
3. If you need a new component, check whether a shadcn primitive exists first. Install with `bunx shadcn@latest add <name>`. Style via `className`, not forks.
4. Never introduce a new color without a token name.
5. Never introduce CSS-in-JS libraries.

---

## Reference

- Component tokens are declared in [app/globals.css](app/globals.css)
- Brand / motion rationale lives in [CLAUDE.md](CLAUDE.md)
- Content surfaces lives in [content/](content/)
