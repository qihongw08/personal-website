# Personal Website

Next.js 15 + Tailwind v4 + shadcn/ui + Framer Motion. Live GitHub data, Spotify embed, deploys to Vercel.

## Run locally

```bash
bun install
cp .env.example .env.local   # then paste your GITHUB_TOKEN
bun run dev
```

→ http://localhost:3000

## Updating your info

Everything visible on the site lives in `content/`:

| Want to change… | Edit |
|---|---|
| Name, bio, contact, skills | `content/profile.ts` |
| Career entries | `content/experience.ts` |
| Featured projects | `content/projects.ts` |
| HackMIT / Dean's List | `content/achievements.ts` |
| Hobby copy + photo labels | `content/hobbies.ts` |
| Friends graph nodes | `content/friends.ts` |
| Favorite song | `content/song.ts` (Spotify track ID) |

Photos go in `public/photos/` — reference them by path inside the `content/*.ts` files.
Resume PDF is at `public/resume.pdf`.

## Deploy

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Set env vars in the Vercel project:
   - `GITHUB_TOKEN` — PAT with `public_repo` scope
   - `GITHUB_USERNAME` — your handle (default `qihongw08`)
4. Deploy. ISR refreshes GitHub stats hourly.

## Stack

- **Next.js 15** App Router, React 19, TypeScript strict
- **Tailwind v4** + CSS variables (`app/globals.css`)
- **shadcn/ui** primitives in `components/ui/`
- **Framer Motion** for reveals / scroll animation
- **Canvas** for FriendsGraph
- **Octokit** REST + GraphQL; **zod** env validation

See [`CLAUDE.md`](./CLAUDE.md) for coding standards and architecture notes.
