import { test, expect } from '@playwright/test';
import { BASE } from '../base.mjs';
import { CHARTS } from '../scripts/charts.mjs';

const ESSAY = `${BASE}/writing/ai-coding-bill-wrong-reason/`;

for (const { testid: id } of CHARTS) {
  test(`${id}: only the active theme variant shows, and the toggle swaps it`, async ({ page }) => {
    await page.goto(ESSAY);
    const chart = page.getByTestId(id);
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const shown = dark ? 'chart-dark' : 'chart-light';
    const hidden = dark ? 'chart-light' : 'chart-dark';
    await expect(chart.locator(`picture.${shown} img`)).toBeVisible();
    await expect(chart.locator(`picture.${hidden} img`)).toBeHidden();
    await page.getByTestId('theme-toggle').click();
    await expect(chart.locator(`picture.${hidden} img`)).toBeVisible();
    await expect(chart.locator(`picture.${shown} img`)).toBeHidden();
  });

  test(`${id}: no horizontal overflow and a readable render size at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(ESSAY);
    const img = page.getByTestId(id).locator('picture:visible img');
    await img.scrollIntoViewIfNeeded();
    await expect(img).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect(await img.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain('-narrow.svg');
    const { width } = (await img.boundingBox())!;
    expect(width / 280 * 13).toBeGreaterThanOrEqual(12);
  });

  test(`${id}: figure height is stable while SVGs load and after a theme toggle`, async ({ page }) => {
    await page.route('**/images/charts/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto(ESSAY, { waitUntil: 'domcontentloaded' });
    const chart = page.getByTestId(id);
    const height = async () => (await chart.boundingBox())!.height;
    const withinFivePercent = (a: number, b: number) => Math.abs(a - b) / b <= 0.05;
    const before = await height();
    await page.waitForFunction((testid) => [...document.querySelectorAll(`[data-testid="${testid}"] img`)].every((img) => (img as HTMLImageElement).complete), id, { timeout: 20_000 });
    const after = await height();
    expect(withinFivePercent(before, after), `before ${before}, after ${after}`).toBe(true);
    await page.getByTestId('theme-toggle').click();
    expect(withinFivePercent(await height(), after)).toBe(true);
  });
}
