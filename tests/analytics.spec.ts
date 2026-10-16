import { test, expect, Page } from '@playwright/test';
import { BASE } from '../base.mjs';


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
  test('the bar asks first, nothing loads from Google before a yes, and No is as easy as Yes', async ({ page }) => {
    const requests = await stubGoogle(page);
    await page.goto(`${BASE}/`);
    const bar = page.getByTestId('consent-bar');
    await expect(bar).toBeVisible();
    await expect(page.getByRole('region', { name: 'Analytics consent' })).toBeVisible();
    await expect(page.locator('dialog')).toHaveCount(0);
    await expect(bar).toContainText('Can I count your visit?');
    await page.waitForLoadState('networkidle');
    expect(requests).toHaveLength(0);
    const [yes, no] = await Promise.all([
      page.getByTestId('consent-yes').boundingBox(),
      page.getByTestId('consent-no').boundingBox(),
    ]);
    expect(Math.round(yes!.width)).toBe(Math.round(no!.width));
    expect(Math.round(yes!.height)).toBe(Math.round(no!.height));
  });

  test('the bar is non-modal: no focus trap, no overlay, page stays clickable and scrollable behind it', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('consent-bar')).toBeVisible();
    await expect(page.getByTestId('consent-yes')).not.toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('consent-bar')).toBeVisible();
    await page.getByTestId('nav-journey').click();
    await expect(page.getByTestId('journey-hero')).toBeVisible();
    const scrolled = await page.evaluate(() => { window.scrollTo({ top: 200, behavior: 'instant' }); return window.scrollY; });
    expect(scrolled).toBeGreaterThan(0);
    await expect(page.getByTestId('consent-bar')).toBeVisible();
  });

  test('the bar sits at the bottom and reserves page padding so content is not permanently covered', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const bar = page.getByTestId('consent-bar');
    await expect(bar).toBeVisible();
    const { barHeight, padding, position } = await page.evaluate(() => {
      const el = document.getElementById('consent-bar')!;
      return {
        barHeight: el.offsetHeight,
        padding: parseFloat(getComputedStyle(document.body).paddingBottom),
        position: getComputedStyle(el).position,
      };
    });
    expect(position).toBe('fixed');
    expect(padding).toBeGreaterThanOrEqual(barHeight);
    await page.getByTestId('consent-no').click();
    await expect(bar).toBeHidden();
    expect(await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom) || 0)).toBeLessThan(barHeight);
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
  test.use({ viewport: { width: 375, height: 667 } });

  test('the bar is compact, fits without horizontal overflow and has 44px tap targets', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('consent-bar')).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement!.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    const [yes, no] = await Promise.all([
      page.getByTestId('consent-yes').boundingBox(),
      page.getByTestId('consent-no').boundingBox(),
    ]);
    expect(yes!.width).toBe(no!.width);
    expect(yes!.height).toBeGreaterThanOrEqual(44);
    expect(no!.height).toBeGreaterThanOrEqual(44);
    const bar = await page.getByTestId('consent-bar').boundingBox();
    expect(bar!.height).toBeLessThanOrEqual(667 * 0.25);
    expect(bar!.y + bar!.height).toBeCloseTo(667, 0);
  });
});
