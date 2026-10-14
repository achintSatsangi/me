# me

This is where I put what I write and build: engineering notes, my LinkedIn posts gathered in one place, and the path that got me here. It's for peers and technical leaders who want to know how I think about systems, restraint and AI before we talk. It's built the way I like to build things: small, static and tested.

Live at https://achintsatsangi.github.io/me/

## Stack

Astro (static output), Tailwind, one React island for the LinkedIn feed, GitHub Pages via GitHub Actions. Versions live in `package.json`.

## Pages

- `/` - who I am, what I believe about work, how I think about AI, recommendations, contact
- `/journey/` - roles from 2007 to now, plus selected GitHub repos
- `/feed/` - my LinkedIn posts, full text, newest first
- `/articles/` - pieces published elsewhere
- `/privacy/` - what the opt-in analytics collect and for how long
- `/rss.xml` - full-text feed of the LinkedIn posts
- `/sitemap-index.xml`, `/robots.txt` - generated at build

## Run it

```
npm ci
npm run dev          # http://localhost:4321/me/
npm run build        # runs data:sync first, then astro build into dist/
npm run test:unit    # node --test; reads dist/, so build first
npm run test:e2e     # Playwright, light and dark themes, against astro preview
```

## Data

Content lives in `src/data/*.json` and is committed. `npm run build` first runs `data:sync`, which tries to refresh two files:

- `linkedin-posts.json` from a private local export of my LinkedIn posts, read from the path in the `LINKEDIN_DB` environment variable. Posts I don't want on the site go in `scripts/excluded-posts.json`, so the next sync doesn't bring them back.
- `articles.json` from my author page on the publisher's site.

Both steps fail soft: without `LINKEDIN_DB` or network access, the committed JSON is kept and the build still passes. That's how CI builds. A local build can rewrite tracked JSON, so check `git diff src/data` before committing.

## Deploy

A push to `main` builds and deploys to GitHub Pages. CI builds and runs the unit tests; the Playwright suite runs locally before every commit.

Verify a deploy:

```
SITE=https://achintsatsangi.github.io/me
curl -sI $SITE/ | head -1                     # 200
curl -s $SITE/sitemap-0.xml | grep -c '<loc>'  # one per page
curl -s $SITE/rss.xml | head -c 200
```

## License

See `LICENSE`.
