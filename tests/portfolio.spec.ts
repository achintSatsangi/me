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
    await expect(page.getByTestId('hero-beliefs').locator('p')).toHaveCount(5);
    await expect(page.getByTestId('hero-doors').locator('a')).toHaveCount(3);
    await expect(page.getByTestId('hero-photo')).toBeVisible();
    await expect(page.getByTestId('hero-offclock')).toContainText('walking pad');
  });

  test('social-proof strip shows three fragments and deep-links to journey recs', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const proof = page.getByTestId('hero-proof');
    await expect(proof.locator('> div')).toHaveCount(3);
    await expect(proof).toContainText('smartest Java developers');
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
    for (const first of ['christian', 'per', 'endre', 'prashant']) {
      await expect(page.getByTestId(`rec-${first}`)).toBeVisible();
    }
  });

  test('project details are collapsed by default and expand on click', async ({ page }) => {
    await page.goto(`${BASE}/journey/`);
    const mumbai = page.getByTestId('role-projects').last();
    const blurb = mumbai.getByText('first online mutual-fund');
    await expect(blurb).toBeHidden();
    await mumbai.getByText(/^The projects —/).click();
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
