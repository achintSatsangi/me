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
    await expect(page.getByTestId('hero-intro')).toContainText('Mumbaikar');
    await expect(page.getByTestId('hero-beliefs').locator('p')).toHaveCount(5);
    await expect(page.getByTestId('hero-doors').locator('a')).toHaveCount(3);
    await expect(page.getByTestId('hero-photo')).toBeVisible();
  });
});

test.describe('Journey page shows all roles + recommendations', () => {
  test('all 10 roles land on the timeline', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const timeline = page.getByTestId('journey-timeline');
    await expect(timeline.locator('article')).toHaveCount(10);
  });

  test('5 recommendations render with attribution', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const recs = page.getByTestId('recommendations');
    await expect(recs.locator('blockquote')).toHaveCount(5);
    // Named recommenders each present
    for (const first of ['christian', 'marius', 'per', 'prashant', 'hina']) {
      await expect(page.getByTestId(`rec-${first}`)).toBeVisible();
    }
  });
});

test.describe('Feed page — filters and posts', () => {
  test('shows filter chips and at least one post', async ({ page }) => {
    await page.goto(`${BASE}/feed/`);
    await expect(page.getByTestId('feed-filters')).toBeVisible();
    await expect(page.getByTestId('filter-all')).toBeVisible();
    const posts = page.getByTestId('feed-post');
    await expect(posts.first()).toBeVisible({ timeout: 5000 });
  });

  test('filter narrows the list (AI filter)', async ({ page }) => {
    await page.goto(`${BASE}/feed/`);
    const before = await page.getByTestId('feed-post').count();
    await page.getByTestId('filter-ai').click();
    const after = await page.getByTestId('feed-post').count();
    // AI filter should either narrow or match — never expand
    expect(after).toBeLessThanOrEqual(before);
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
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(after).toBe(!initial);
  });
});
