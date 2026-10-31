import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const SIZE = { width: 1200, height: 630 };
const PAPER = '#FBFBFD';
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, system-ui, sans-serif`;
const dataUri = (path, type) => `data:${type};base64,${readFileSync(path).toString('base64')}`;

const defaultCard = () => `<style>
  body{margin:0;width:1200px;height:630px;background:#0A0A0C;display:flex;font-family:${FONT}}
  .text{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 40px 0 80px}
  h1{margin:0;font-size:104px;line-height:1.02;letter-spacing:-0.03em;font-weight:700;color:#F5F5F7}
  p{margin:28px 0 0;font-size:34px;color:#86868B}
  .photo{width:470px;height:630px;background:url(${dataUri('public/images/portrait.webp', 'image/webp')}) 50% 45%/cover;filter:grayscale(1)}
</style><div class="text"><h1>Achint Satsangi</h1><p>Senior Software Engineer · Oslo, Norway</p></div><div class="photo"></div>`;

const chartCard = (svgPath) => `<style>
  body{margin:0;width:1200px;height:630px;background:${PAPER};display:flex;align-items:center;justify-content:center}
  img{height:540px}
</style><img src="${dataUri(svgPath, 'image/svg+xml')}">`;

async function writePng(buffer, out) {
  writeFileSync(out, await sharp(buffer).png({ palette: true, quality: 90, effort: 10 }).toBuffer());
}

async function shoot(browser, html, out) {
  const page = await browser.newPage({ viewport: SIZE, colorScheme: 'light' });
  await page.setContent(html);
  await writePng(await page.screenshot(), out);
  await page.close();
}

async function shootDeckSlideOne(browser, out) {
  const page = await browser.newPage({ viewport: SIZE, colorScheme: 'light' });
  await page.goto(pathToFileURL('public/deck/ai-adoption-journey.html').href);
  await page.addStyleTag({ content: '#nav{display:none!important}' });
  await page.waitForTimeout(2500);
  await writePng(await page.screenshot(), out);
  await page.close();
}

const browser = await chromium.launch();
await shoot(browser, defaultCard(), 'public/og-default.png');
await shoot(browser, chartCard('public/images/charts/spend-billing-light.svg'), 'public/images/writing/ai-coding-bill-wrong-reason-og.png');
await shootDeckSlideOne(browser, 'public/images/writing/ai-adoption-story-og.png');
await browser.close();
