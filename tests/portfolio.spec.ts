import { test, expect, Page } from '@playwright/test';

const BASE = '/me';
const pages = [
  { path: `${BASE}/`, name: 'landing', testid: 'hero-name' },
  { path: `${BASE}/journey/`, name: 'journey', testid: 'journey-hero' },
  { path: `${BASE}/feed/`, name: 'feed', testid: 'feed-hero' },
  { path: `${BASE}/articles/`, name: 'articles', testid: 'articles-hero' },
];

async function ensureTheme(page: Page, want: 'light' | 'dark') {
  // colorScheme project setting seeds prefers-color-scheme; enforce via localStorage before load
  await page.addInitScript((theme) => {
    localStorage.setItem('theme', theme);
  }, want);
}

test.describe('Portfolio — every page renders on light + dark', () => {
  for (const p of pages) {
    test(`${p.name} loads and shows its hero`, async ({ page }, testInfo) => {
      const theme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
      await ensureTheme(page, theme);
      await page.goto(p.path);
      await expect(page.getByTestId(p.testid)).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `test-results/screenshots/${p.name}-${theme}.png`,
        fullPage: true,
      });
    });
  }
});

test.describe('Landing content is complete', () => {
  test('hero renders name, masthead, intro, beliefs, doors, photo', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('hero-name')).toContainText('Achint');
    await expect(page.getByTestId('hero-masthead')).toContainText('messy engineering');
    await expect(page.getByTestId('hero-intro')).toContainText('mutual-fund');
    await expect(page.getByTestId('hero-beliefs').locator('p')).toHaveCount(6);
    await expect(page.getByTestId('hero-doors').locator('a')).toHaveCount(3);
    await expect(page.getByTestId('hero-photo')).toBeVisible();
    await expect(page.getByTestId('hero-offclock')).toContainText('walking pad');
    const offclockPhoto = page.getByTestId('hero-offclock-photo').locator('img');
    await offclockPhoto.scrollIntoViewIfNeeded();
    await expect(offclockPhoto).toHaveAttribute('alt', /cairn/);
    await expect.poll(() => offclockPhoto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test('social-proof strip shows three fragments and deep-links to journey recs', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const proof = page.getByTestId('hero-proof');
    await expect(proof.locator('> div')).toHaveCount(4);
    await expect(proof).toContainText('smartest Java developers');
    await expect(page.getByTestId('proof-together')).toHaveText([
      'Worked together at FINN, 2022–2024',
      'Worked together at Posten Norge, 2015–2019',
      'Worked together at CGI, 2019–2021',
      'Worked together at TCS Johannesburg, 2010–2012',
    ]);
    await expect(page.getByTestId('hero-proof-section').getByRole('link', { name: 'Read all →' }))
      .toHaveAttribute('href', /\/journey\/#recommendations$/);
  });
});

test.describe('Journey page shows all roles + recommendations', () => {
  test('all 9 roles land on the timeline', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const timeline = page.getByTestId('journey-timeline');
    await expect(timeline.locator('article')).toHaveCount(9);
  });

  test('recommendations render with attribution', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const recs = page.getByTestId('recommendations');
    await expect(recs).toHaveAttribute('id', 'recommendations');
    await expect(recs.locator('blockquote')).toHaveCount(4);
    // Curated four each present
    for (const first of ['christian', 'marius', 'endre', 'prashant']) {
      await expect(page.getByTestId(`rec-${first}`)).toBeVisible();
      await expect(page.getByTestId(`rec-${first}`).getByTestId('rec-together')).toContainText('Worked together at');
    }
  });

  test('project details are collapsed by default and expand on click', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const mumbai = page.getByTestId('role-projects').last();
    const blurb = mumbai.getByText('first online mutual-fund');
    await expect(blurb).toBeHidden();
    await mumbai.getByText(/^The projects -/).click();
    await expect(blurb).toBeVisible();
  });

  test('restricted role shows policy note, not an NDA', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const vend = page.getByTestId('journey-timeline').locator('article').first();
    await expect(vend).toContainText('privacy policy and code of conduct');
    await expect(vend).not.toContainText('NDA');
    // Vend summary renders as two paragraphs
    await expect(vend.getByTestId('role-summary').locator('p')).toHaveCount(2);
  });
});

test.describe('Feed page — filters and posts', () => {
  test('shows at least one post and no filter chips', async ({ page }) => {
    await page.goto(`${BASE}/feed/`);
    await expect(page.getByTestId('feed-post').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('feed-filters')).toHaveCount(0);
    await expect(page.getByTestId('feed-post').first()).not.toContainText('· You');
  });

  test('multi-image posts render as a LinkedIn-style collage', async ({ page }) => {
    await page.goto(`${BASE}/feed/`);
    const collage = page.getByTestId('post-collage').filter({ has: page.locator('img[src*="cost-scenario-totals"]') });
    await expect(collage.locator('img')).toHaveCount(3);
    const [big, small] = await Promise.all([
      collage.locator('img').nth(0).boundingBox(),
      collage.locator('img').nth(1).boundingBox(),
    ]);
    expect(big!.width).toBeGreaterThan(small!.width * 1.8);
  });

  test('posts side by side share the same height', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/feed/`);
    await expect(page.locator('astro-island[client="idle"]')).not.toHaveAttribute('ssr', /.*/);
    const [left, right] = await page.getByTestId('feed-post').evaluateAll((cards) =>
      cards.slice(0, 2).map((c) => { const r = c.getBoundingClientRect(); return { top: r.top, height: r.height }; }));
    expect(left).toEqual(right);
  });

  test('collapsed text fills the height the row gives it, also after the neighbour expands', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/feed/`);
    await expect(page.locator('astro-island[client="idle"]')).not.toHaveAttribute('ssr', /.*/);
    const TWO_LINES = 2 * 15 * 1.55;
    const spareBelowText = (i: number) => page.getByTestId('feed-post').nth(i).evaluate((card) => {
      const text = card.querySelector('p[id^="post-body-"]')!.getBoundingClientRect();
      const body = card.querySelector('p[id^="post-body-"]')!.parentElement!.getBoundingClientRect();
      return { spare: body.bottom - text.bottom, truncated: !!card.querySelector('[data-testid="post-toggle"]') };
    });
    for (const expandIndex of [null, 1, 2]) {
      if (expandIndex !== null) await page.getByTestId('feed-post').nth(expandIndex).getByTestId('post-toggle').click();
      const neighbour = expandIndex === null ? 0 : expandIndex ^ 1;
      await expect.poll(async () => {
        const { spare, truncated } = await spareBelowText(neighbour);
        return spare >= 0 && (!truncated || spare < TWO_LINES);
      }).toBe(true);
    }
  });

  test('see more expands a post and see less collapses it', async ({ page }) => {
    await page.goto(`${BASE}/feed/`);
    await expect(page.locator('astro-island[client="idle"]')).not.toHaveAttribute('ssr', /.*/);
    const toggle = page.getByTestId('post-toggle').first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveText('see less');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Articles page — theprint list', () => {
  test('featured + at least one earlier article', async ({ page }) => {
    await page.goto(`${BASE}/articles/`);
    await expect(page.getByTestId('articles-featured')).toBeVisible();
    await expect(page.getByTestId('article-item').first()).toBeVisible();
  });
});

test.describe('Theme toggle round-trip', () => {
  test('clicking toggle flips the html class', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const initial = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.getByTestId('theme-toggle').click();
    await expect(page.getByTestId('theme-toggle')).toContainText(initial ? 'Turn off the lights' : 'Turn on the lights');
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(after).toBe(!initial);
  });
});

test.describe('Responsive — 375px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const phonePages = [
    { name: 'landing', path: `${BASE}/` },
    { name: 'journey', path: `${BASE}/journey/` },
    { name: 'feed', path: `${BASE}/feed/` },
    { name: 'articles', path: `${BASE}/articles/` },
  ];

  for (const p of phonePages) {
    test(`${p.name} has no horizontal overflow and the nav links are visible`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.scrollingElement!.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
      for (const id of ['nav-journey', 'nav-feed', 'nav-articles']) {
        await expect(page.getByTestId(id)).toBeVisible();
      }
      await expect(page.getByTestId('nav-home')).toHaveCount(0);
    });
  }

  test('theme toggle sits in the nav as an icon only', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const toggle = page.locator('nav').getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('footer [data-testid="theme-toggle"]')).toHaveCount(0);
    await expect(toggle).toHaveAccessibleName(/Turn (on|off) the lights/);
    const box = await toggle.boundingBox();
    expect(box!.width).toBeLessThan(60);
  });
});
