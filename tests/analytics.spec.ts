import { test, expect, Page } from '@playwright/test';

const BASE = '/me';

test.use({ storageState: { cookies: [], origins: [] } });

async function stubGoogle(page: Page) {
  const requests: string[] = [];
  await page.route(/googletagmanager\.com/, (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  return requests;
}

test.describe('Analytics consent', () => {
  test('nothing loads from Google before a yes', async ({ page }) => {
    const requests = await stubGoogle(page);
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('consent-bar')).toBeVisible();
    await page.getByTestId('nav-journey').click();
    await expect(page.getByTestId('journey-hero')).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test('yes loads GA, hides the bar and reports clicks with readable labels', async ({ page }) => {
    const requests = await stubGoogle(page);
    await page.goto(`${BASE}/`);
    await page.getByTestId('consent-yes').click();
    await expect(page.getByTestId('consent-bar')).toBeHidden();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect(page.getByTestId('analytics-settings')).toHaveText('Analytics: on');

    await page.getByTestId('theme-toggle').click();
    const events = await page.evaluate(() =>
      (window as any).dataLayer.filter((a: any) => a[0] === 'event' && a[1] === 'ui_click').map((a: any) => a[2]));
    expect(events).toContainEqual(expect.objectContaining({ click_label: 'theme-toggle' }));

    await page.reload();
    await expect(page.getByTestId('consent-bar')).toBeHidden();
    await expect.poll(() => requests.length).toBeGreaterThan(1);
  });

  test('no keeps Google out, also on the next page', async ({ page }) => {
    const requests = await stubGoogle(page);
    await page.goto(`${BASE}/`);
    await page.getByTestId('consent-no').click();
    await expect(page.getByTestId('consent-bar')).toBeHidden();
    await page.getByTestId('nav-feed').click();
    await expect(page.getByTestId('feed-hero')).toBeVisible();
    await expect(page.getByTestId('consent-bar')).toBeHidden();
    expect(requests).toHaveLength(0);
  });

  test('the footer switch withdraws consent and stops loading GA', async ({ page }) => {
    const requests = await stubGoogle(page);
    await page.goto(`${BASE}/`);
    await page.getByTestId('consent-yes').click();
    await page.getByTestId('analytics-settings').click();
    await page.waitForLoadState('load');
    await expect(page.getByTestId('analytics-settings')).toHaveText('Analytics: off');
    const before = requests.length;
    await page.reload();
    await expect(page.getByTestId('consent-bar')).toBeHidden();
    expect(requests.length).toBe(before);
  });

  test('the privacy page explains what is collected', async ({ page }) => {
    await page.goto(`${BASE}/privacy/`);
    await expect(page.getByTestId('privacy-hero')).toBeVisible();
    await expect(page.locator('main')).toContainText('14 months');
  });
});

test.describe('Analytics consent - 375px phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the bar fits without horizontal overflow', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('consent-bar')).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement!.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
});
