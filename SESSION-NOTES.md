# Session notes — 2026-09-26

Autonomous improvement window while Achint was away. Everything below is committed and green.

## What landed
- **Marit content pass.** Landing rewritten around 7 sections (hero → photo+intro → known-for → beliefs → AI position → currently → contact). Journey hero + GitHub subhead rewritten, 4 role summaries tightened, new "A note on nineteen years" witness block. Feed + Articles hero copy sharpened.
- **Sigrid design pass.** Reordered landing so photo+intro sits right after hero (was buried at position 3). Demoted "What I'm known for" from display-scale to prose bullets so it stops fighting the beliefs list downstairs. Hardened AI-section pull-phrases (was italic `<em>`, now medium-weight ink — landed as a statement, not a whisper). Dropped Currently body one type-step so it reads as a log, not a manifesto. Bumped contact links from meta (14px) to base+. Added a marginalia rule (`border-l`) on the journey witness note.
- **Deploy pipeline.** `.github/workflows/deploy.yml` — GitHub Actions builds and pushes to Pages on every commit to main/master. Concurrency-gated. Enable Pages in repo settings → "GitHub Actions" source; first push runs it.
- **OG meta + favicon.** `<meta property="og:*">`, Twitter card, canonical URL wired into `Layout.astro`. `public/favicon.svg` — dark monogram tile.
- **LinkedIn feed refreshed.** 20 latest posts from `~/dev/ultra-personal/social-dump/data/social.sqlite`.
- **Tests green.** 22/22 on chromium-light + chromium-dark. Walkthroughs regenerated (`walkthroughs/light.webm`, `walkthroughs/dark.webm`).

## What did NOT land
- **Ingrid QA sweep** — Vertex EU quota returned 429 on `claude-haiku-4-5` mid-run. Skipped rather than retry-storm. Pick up next session; her lens is edge cases / empty states / i18n / offline behaviour.

## Open judgment calls (nothing blocks a push)
- Photo placeholder is still the "AS unposed candid — TBD" tile. Sigrid didn't push on it; recruiters won't either. Whenever you're ready, drop a real image at `src/assets/` and swap the tile.
- Sigrid flagged the AI section could eventually become its own page. Not this pass — flagged for after the next Marit round if the copy grows.
- Deploy workflow triggers on `main` and `master`. Repo is on `main`; the `master` branch listing is defensive. Delete it if you'd rather not.

## To go live
1. `git push` (needs your explicit go-ahead — feedback_confirm_before_pushing).
2. Repo settings → Pages → Source: "GitHub Actions".
3. First push runs the workflow; site lands at `https://achintsatsangi.github.io/me/`.

## For the next session
- Rerun Ingrid when Vertex quota resets.
- Consider a real photo swap.
- Decide whether the AI section splits out.
