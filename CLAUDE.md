# CLAUDE.md

Instructions for AI coding agents working in this repo. The repo is public: never commit anything private (personal notes, local paths, data beyond the exported JSON, secrets).

## What this site is

Achint Satsangi's personal site: his writing, his LinkedIn posts in one place, and his path as an engineer. Audience is peers and technical leaders, inside his employer and outside it. It is not a job-hunting site and not a marketing page. Restraint is part of the signal: small, static, tested.

## Copy and voice

- The copy is Achint's voice. Never invent claims, numbers, roles, outcomes or quotes. If a fact isn't in `src/data/` or supplied by him, ask.
- Tone is confident and building. No discontent, no "next chapter", nothing that reads as looking for a way out.
- Team work is "we". No colleague names without their consent. Mistakes are owned as a team.
- No employer-internal handles, URLs or systems on the site.
- Delete before adding. No new sections, badges or widgets unless he asks.

## Engineering rules

- Simplest thing that works. Every added dependency, abstraction or config knob has to earn its cost.
- No comments by default. Name things for their purpose; put the why in the commit message.
- Before every commit: `npm run build`, `npm run test:unit`, `npm run test:e2e`, all green. CI builds, runs the unit tests and deploys; the Playwright suite runs locally before every commit.
- Small commits. Bulleted messages where each bullet says why, not just what.
- Never push without Achint's explicit go-ahead.
- No hard-wrapped lines in any file, commit message or doc. One paragraph or bullet per line.
- `SITE_URL` in `astro.config.mjs` is the single source for the host. The `/me` base lives in `base.mjs`, which `astro.config.mjs` and the Playwright specs both import.

## Invariants that are easy to break

- `GOOGLE_SITE_VERIFICATION` in `src/config.ts` must stay. Removing it unverifies Search Console.
- Analytics is opt-in. Nothing from Google loads before the visitor accepts on the consent dialog. `/privacy/` promises consent-gated analytics, 14-month retention and no ads; any analytics change must keep those true, and the GA admin settings must match.
- Analytics labels clicks by `data-track`, then `data-testid`, then accessible name. Renaming a testid renames an analytics label.
- Exactly one `h1` per page. Keep `svg` and `img` out of heading elements.
- Decorative SVGs and logos are `aria-hidden="true"`; logo images have `alt=""`. Text next to them carries the meaning.
- Flags are SVG (`src/components/Flag.astro`), never emoji: Windows renders emoji flags as letters.
- One accent colour per theme, defined in `tailwind.config.mjs`. New colours must pass WCAG AA in both light and dark.
- Check layouts at 375px and 320px.

## Data

- `src/data/*.json` is committed and is what CI deploys. `npm run build` runs `data:sync` first; it fails soft when `LINKEDIN_DB` (path to the private export) is unset or the network is missing. Keep it fail-soft. Check `git diff src/data` before committing.
- New LinkedIn posts go at the top of `src/data/linkedin-posts.json`. To drop a post, add its link to `scripts/excluded-posts.json`; deleting it from the JSON alone gets undone by the next sync.

## Settled decisions

Don't reopen these without Achint asking:

- The site stays on `achintsatsangi.github.io/me` for now.
- The feed page stays and has no filters. Improve how it reads; don't cut it.
- No icons on section headings. Icons only where they help someone act (contact links, the GitHub mark).
- Flags only on the Journey route line. Company logos on the Journey timeline, local assets on a uniform tile.
- The light/dark toggle stays.
- Writing lives at `/writing/` with an Engineering | ThePrint switch (Engineering default; both lists in the static HTML, the switch only shows and hides). `/articles/` stays as a redirect page.
- Essays are Markdown files in `src/content/writing/`. Drafts never enter this repo; an essay arrives in its publish commit.
- The essay page stays minimal: title, dates with reading time, a TL;DR, body, "Discuss this on LinkedIn". Reading time is computed at build time from the body; the `tldr` frontmatter field is required. No tags, share buttons, related posts or newsletter.
