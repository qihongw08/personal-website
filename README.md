# personal-website

My personal site, deployed on **Vercel** @ **[qihongwu.us](https://qihongwu.us)**. It includes my bio, career timeline, projects, friends, hobbies.

Built with the help of my best engineer Claude Opus 4.6

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** strict
- **Tailwind v4** with design tokens as CSS variables
- **shadcn/ui** primitives, **Framer Motion** for reveals and the scroll-linked career timeline
- **Octokit** REST + GraphQL, **zod** for env validation
- **Bun** for install + scripts

## Some things I think are neat

### Friend graph — Kruskal's MST + Fruchterman–Reingold

[components/friend-graph/](components/friend-graph/) renders a force-directed graph of people I know, where edges connect friends who share tags (college, hackathons, work, etc). Kruskal's MST picks which edges to draw so the graph stays readable instead of turning into a hairball. Fruchterman–Reingold then lays out the nodes — repulsion between every pair, springs along the MST edges, cooled over iterations until it settles. Deterministic, so SSR hydration doesn't flicker.

### Friend nodes from a weekly LinkedIn scrape

A weekly GitHub Action scrapes my LinkedIn connections via Apify and uploads the result to Vercel Blob. The graph hydrates from that blob at render time, with a fallback node if a URL hasn't been scraped yet.

### Live League of Legends card

The hobbies section hits the **Riot API** for my current rank, LP, win rate, and top champion masteries. Past-season rank history is hand-curated.

### KuGou top-played

I use **KuGou 酷狗** (the Chinese version of Spotify), so the music card pulls from there. KuGou has no public API, so I deployed [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) — a community Node.js wrapper around KuGou's internal endpoints — as a separate Vercel project, and this site calls it. My session token + cookies live in Vercel Blob; a Vercel cron that hits `/login/token` to extend the session and writes any rotated values back so the integration doesn't drift offline.

### Live GitHub data, batched

Every project card shows real commit counts and a mini activity graph. All projects share a single batched GraphQL round-trip per render. Aggregated repo lists let a multi-repo project show one combined number. The about-section heatmap is the real GitHub contribution graph.

### Content as data

Every user-visible string and photo path lives in [content/](content/). No hardcoded copy in components — updating the site is editing one of those files.

## Architecture notes

See [CLAUDE.md](./CLAUDE.md) for the conventions I follow when working on this.
