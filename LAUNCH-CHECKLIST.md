# Launch checklist

Launched and ranking are different milestones. This file gets the site to launched and submitted. Ranking for "Achint Satsangi" takes weeks after that and nothing here speeds it up.

## 0. Decide the domain first (Achint's call)

- **A. Custom domain (e.g. achintsatsangi.com).** Costs about a domain fee per year and one DNS setup. Gives a root-level robots.txt, a Search Console Domain property, a URL that never changes if you move hosts, and a cleaner knowledge-panel candidate.
- **B. Stay on achintsatsangi.github.io/me.** Free, nothing to set up. But robots.txt at `/me/robots.txt` is ignored by crawlers (they read the host root, which belongs to the github.io user site), Search Console only allows a URL-prefix property, and the URL is tied to GitHub.

Everything below is written for both. Steps marked A or B apply only to that choice.

## 1. Launch diff

Do this on one branch, in one commit, so the gate comes off atomically.

### 1.1 Remove noindex (`src/layouts/Layout.astro`)

Delete these two lines. This is the blocker that beats every other bug: while it is there, Google will never show the site.

```diff
-  {/* PREVIEW GATE — remove this line at public launch. Keeps the private-feedback build out of search indexes. */}
-  <meta name="robots" content="noindex, nofollow" />
```

### 1.2 Remove the preview shell

```diff
# package.json
-    "build": "npm run data:sync && astro build && node scripts/inject-preview-shell.mjs",
+    "build": "npm run data:sync && astro build",
```

```sh
git rm scripts/inject-preview-shell.mjs preview/under-construction.html
rm -rf dist
```

The real 404 comes from `src/pages/404.astro` (already in the tree). Without the shell it lands at `dist/404.html` and GitHub Pages serves it for unknown paths.

### 1.3 Site URL, base and outDir (`astro.config.mjs`)

`SITE_URL` is the single source for canonical, og:url, og:image, JSON-LD ids, sitemap and robots.txt. Nothing else hard-codes the host.

**A. Custom domain**

```diff
-const SITE_URL = 'https://achintsatsangi.github.io';
+const SITE_URL = 'https://achintsatsangi.com';
-// PREVIEW GATE — ...
-const previewSlug = '20f3e6d7ccaf900775';
 export default defineConfig({
   site: SITE_URL,
-  base: `/me/${previewSlug}`,
-  outDir: `./dist/${previewSlug}`,
```

**B. github.io/me**

```diff
-// PREVIEW GATE — ...
-const previewSlug = '20f3e6d7ccaf900775';
 export default defineConfig({
   site: SITE_URL,
-  base: `/me/${previewSlug}`,
-  outDir: `./dist/${previewSlug}`,
+  base: '/me',
```

### 1.4 Tests hard-code the slug

```diff
# tests/portfolio.spec.ts and tests/walkthrough.spec.ts
-const BASE = '/me/20f3e6d7ccaf900775';
+const BASE = '';      // A
+const BASE = '/me';   // B
```

### 1.5 CNAME file: not needed

The deploy workflow publishes through GitHub Actions, and GitHub ignores a `CNAME` file in that mode. The domain is set in repo settings (step 2A). Do not add `public/CNAME`.

### 1.6 Verify before merging

```sh
npm run build
EXPECT_INDEXABLE=1 npm run test:unit    # fails if any page still carries noindex
npm run test:e2e -- --project=chromium-light --project=chromium-dark
grep -rn "20f3e6d7" src tests astro.config.mjs package.json    # expect nothing
```

## 2. Hosting

- **A.** Repo Settings > Pages > Custom domain: enter the domain, save, tick Enforce HTTPS once the certificate is issued (can take up to an hour). DNS at the registrar: apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (plus matching AAAA records from GitHub's docs), and `www` CNAME to `achintsatsangi.github.io`. Pick apex or www as canonical and let GitHub redirect the other. Verify the domain under the GitHub account settings > Pages to prevent takeover.
- **B.** Nothing. Settings > Pages > Source stays "GitHub Actions".

Push triggers the workflow. Push needs Achint's explicit go-ahead.

## 3. Verify what is served (right after the deploy goes green)

Replace `$SITE` with the live origin (A: `https://achintsatsangi.com`, B: `https://achintsatsangi.github.io/me`).

```sh
curl -sI $SITE/ | head -1                                   # HTTP/2 200
curl -s $SITE/ | grep -ci noindex                           # 0
curl -s $SITE/ | grep -o '<link rel="canonical"[^>]*>'      # live URL, trailing slash
curl -s $SITE/ | grep -o '<meta property="og:image"[^>]*>'  # absolute, 200s below
curl -sI $SITE/og-default.png | head -1                     # 200
curl -s $SITE/sitemap-index.xml                             # points at sitemap-0.xml
curl -s $SITE/sitemap-0.xml | grep -c '<loc>'               # 4
curl -sI $SITE/does-not-exist | head -1                     # 404
curl -sI $SITE/favicon.svg | head -1                        # 200
```

A only: `curl -s https://achintsatsangi.com/robots.txt` shows `Allow: /` and a `Sitemap:` line with the live host. `curl -sI http://achintsatsangi.com/` and the www variant should 301 to the canonical host.

Structured data and previews:

- validator.schema.org on the home URL: one WebSite and one Person, no errors. Person is not a Rich Results Test feature, so do not expect a rich result; the point is the entity and its `sameAs` links.
- LinkedIn Post Inspector and the Facebook Sharing Debugger on the home URL: 1200x630 card shows. Both cache, so scrape again after any image change.

## 4. Search Console

1. **A.** Add a Domain property, verify with the DNS TXT record. **B.** Add a URL-prefix property `https://achintsatsangi.github.io/me/`, verify with the HTML file method (drop the file Google gives you into `public/`).
2. Sitemaps > submit `sitemap-index.xml`. Expect status Success and 5 discovered pages (including `/privacy/`).
3. URL Inspection > the home URL > Test live URL > confirm "URL is available to Google" and no "Excluded by noindex" > Request indexing. Repeat for `/journey/`, `/feed/`, `/articles/`.
4. Bing Webmaster Tools > Import from Google Search Console. One click, covers Bing and DuckDuckGo.

## 4b. Google Analytics

Nothing to change at launch. GA4 (property on Achint's personal Google account, ID `G-V5BMZHJXW5` in `src/config.ts`) is tied to the host, so it keeps working when the preview slug goes. Only for option A: add the custom domain to the web stream's URL. GA loads only after a visitor clicks Yes on the consent bar.

## 5. Close the loop from the profiles

This is the cheapest ranking signal for the name query and it takes two minutes. Put the live site URL in the LinkedIn profile Website field and the GitHub profile Website field. The site's Person JSON-LD already points at both; this makes the link two-way. (Wider distribution is Leif's.)

## 6. What to expect

- Day 0: launched. Not indexed.
- Days 1-7: Search Console shows the pages as "Discovered" then "Crawled". `site:achintsatsangi.com` (or `site:achintsatsangi.github.io/me`) starts returning the home page.
- Weeks 2-6: the site appears for the query "Achint Satsangi" next to LinkedIn and GitHub. Position depends on how many other people share the name; check it in Search Console > Performance, not by googling from a logged-in browser.
- Knowledge panel: not controllable and not promised. Consistent name, sameAs links and third-party mentions are the inputs.
- Head terms and long-tail topic queries: no promise. Articles are on ThePrint, so those pages will rank, not this site.

Status after launch day: not indexed. What tells us otherwise: URL Inspection says "URL is on Google" and `site:` returns the home page.
