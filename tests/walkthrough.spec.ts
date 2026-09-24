import { test, expect, Page } from '@playwright/test';

const BASE = '/me';

// macOS arrow cursor — black outline, white fill, subtle shadow.
const CURSOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="20" height="26" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
  <path d="M4 2 L4 25 L10 20 L13.5 28 L17 26.5 L13.5 18.5 L21 18.5 Z"
        fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

// Inject the cursor into the current page. Call after every page.goto / navigation.
async function attachCursor(page: Page) {
  await page.evaluate((svg) => {
    if (document.getElementById('__pw_cursor')) return;
    const style = document.createElement('style');
    style.textContent = `
      #__pw_cursor {
        position: fixed; top: 0; left: 0; z-index: 2147483647;
        width: 20px; height: 26px; pointer-events: none;
        transform: translate(-9999px, -9999px);
        transition: transform 30ms linear;
      }
    `;
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = '__pw_cursor';
    el.innerHTML = svg;
    document.body.appendChild(el);
    (window as any).__pwMoveCursor = (x: number, y: number) => {
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    (window as any).__pwFlashCursor = () => {
      el.animate(
        [{ transform: el.style.transform + ' scale(1)' },
         { transform: el.style.transform + ' scale(0.75)' },
         { transform: el.style.transform + ' scale(1)' }],
        { duration: 220, easing: 'ease-out' }
      );
    };
  }, CURSOR_SVG);
}

async function moveTo(page: Page, x: number, y: number, steps = 20) {
  const start = await page.evaluate(() => {
    const el = document.getElementById('__pw_cursor');
    const m = el?.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 100, y: 100 };
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // ease-in-out
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const nx = start.x + (x - start.x) * e;
    const ny = start.y + (y - start.y) * e;
    await page.evaluate(([nx, ny]) => (window as any).__pwMoveCursor(nx, ny), [nx, ny]);
    await page.mouse.move(nx, ny);
    await page.waitForTimeout(18);
  }
}

async function clickAt(page: Page, selector: string) {
  const el = await page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) throw new Error(`No bounding box for ${selector}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await moveTo(page, x, y, 25);
  await page.waitForTimeout(300);
  await page.evaluate(() => (window as any).__pwFlashCursor());
  await page.waitForTimeout(200);
  await el.click();
  await page.waitForTimeout(400);
}

// Slow-scroll to a target Y position over `durationMs` at a readable pace.
async function slowScrollTo(page: Page, targetY: number, durationMs: number) {
  const start = await page.evaluate(() => window.scrollY);
  const steps = Math.max(30, Math.round(durationMs / 40));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const y = start + (targetY - start) * e;
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(durationMs / steps);
  }
}

async function scrollThroughPage(page: Page, {
  readTopMs = 1500,
  scrollMs = 8000,
  readBottomMs = 1500,
} = {}) {
  await page.waitForTimeout(readTopMs);
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewport = await page.evaluate(() => window.innerHeight);
  const targetY = Math.max(0, pageHeight - viewport);
  await slowScrollTo(page, targetY, scrollMs);
  await page.waitForTimeout(readBottomMs);
}

async function walkthrough(page: Page, theme: 'light' | 'dark') {
  // Set theme early so first render is already correct.
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);

  // 1. Landing
  await page.goto(`${BASE}/`);
  await attachCursor(page);
  await expect(page.getByTestId('hero-name')).toBeVisible();
  await moveTo(page, 700, 400, 25);
  await scrollThroughPage(page, { readTopMs: 2000, scrollMs: 6000, readBottomMs: 1200 });

  // 2. Nav → Journey
  await clickAt(page, '[data-testid="nav-journey"]');
  await attachCursor(page);
  await expect(page.getByTestId('journey-hero')).toBeVisible();
  await moveTo(page, 600, 400, 25);
  await scrollThroughPage(page, { readTopMs: 1800, scrollMs: 12000, readBottomMs: 1200 });

  // 3. Nav → Feed
  await clickAt(page, '[data-testid="nav-feed"]');
  await attachCursor(page);
  await expect(page.getByTestId('feed-hero')).toBeVisible();
  await moveTo(page, 600, 400, 25);
  await scrollThroughPage(page, { readTopMs: 1600, scrollMs: 3000, readBottomMs: 500 });
  await clickAt(page, '[data-testid="filter-ai"]');
  await page.waitForTimeout(600);
  await scrollThroughPage(page, { readTopMs: 800, scrollMs: 5000, readBottomMs: 800 });

  // 4. Nav → Articles
  await clickAt(page, '[data-testid="nav-articles"]');
  await attachCursor(page);
  await expect(page.getByTestId('articles-hero')).toBeVisible();
  await moveTo(page, 600, 400, 25);
  await scrollThroughPage(page, { readTopMs: 1500, scrollMs: 6000, readBottomMs: 1500 });

  // 5. Home
  await clickAt(page, '[data-testid="nav-home"]');
  await attachCursor(page);
  await expect(page.getByTestId('hero-name')).toBeVisible();
  await page.waitForTimeout(1500);
}

test.describe('Walkthrough — one video per theme', () => {
  test('light theme walkthrough', async ({ page }) => {
    await walkthrough(page, 'light');
  });

  test('dark theme walkthrough', async ({ page }) => {
    await walkthrough(page, 'dark');
  });
});
