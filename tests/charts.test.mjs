import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { CHARTS } from '../scripts/charts.mjs';
import { THEMES } from '../scripts/chart-theme.mjs';

const CHART_DIR = 'public/images/charts';
const ESSAYS = ['src/content/writing/ai-coding-bill-wrong-reason.md'];
const charts = CHARTS.map((c) => c.name);
const variants = ['light', 'dark', 'light-narrow', 'dark-narrow'];

const figures = () => ESSAYS.filter(existsSync).flatMap((essay) => readFileSync(essay, 'utf8').match(/<figure class="chart"[\s\S]*?<\/figure>/g) ?? []);

test('every chart has light, dark, and narrow variants of each', () => {
  for (const chart of charts) {
    for (const variant of variants) {
      assert.ok(existsSync(`${CHART_DIR}/${chart}-${variant}.svg`), `${chart}-${variant}.svg missing`);
    }
    const light = readFileSync(`${CHART_DIR}/${chart}-light.svg`, 'utf8');
    const dark = readFileSync(`${CHART_DIR}/${chart}-dark.svg`, 'utf8');
    assert.notEqual(light, dark, `${chart}: light and dark are identical`);
  }
});

test('the essay embeds a light and a dark picture per chart, with alt text', () => {
  const found = figures();
  for (const c of CHARTS) assert.ok(found.some((f) => f.includes(`data-testid="${c.testid}"`)), `${c.name} not embedded`);
  assert.match(found.find((f) => f.includes('chart-context-bars')), /alt="Bar chart/);
  for (const fig of found) {
    assert.equal((fig.match(/<picture class="chart-light"/g) ?? []).length, 1);
    assert.equal((fig.match(/<picture class="chart-dark"/g) ?? []).length, 1);
    for (const alt of fig.matchAll(/alt="([^"]*)"/g)) assert.ok(alt[1].length > 40, 'alt text states the finding');
  }
});

test('charts carry no dollar sign: SVGs, chart data, embeds', () => {
  const files = readdirSync(CHART_DIR).map((f) => `${CHART_DIR}/${f}`);
  files.push('src/data/chart-spend-billing.json', 'src/data/chart-context.json');
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!text.includes('$'), `${file} contains "$"`);
  }
  for (const fig of figures()) assert.ok(!fig.includes('$'), 'embed contains "$"');
});

test('spend data is indexed, never raw amounts', () => {
  const rows = JSON.parse(readFileSync('src/data/chart-spend-billing.json', 'utf8'));
  for (const row of rows) assert.deepEqual(Object.keys(row), ['date', 'index', 'period']);
  const mean = (p) => {
    const v = rows.filter((r) => r.period === p).map((r) => r.index);
    return v.reduce((a, b) => a + b, 0) / v.length;
  };
  assert.ok(Math.abs(mean('A') - 100) < 1);
});

test('only listed charts have SVGs on disk', () => {
  const names = new Set(readdirSync(CHART_DIR).map((f) => f.replace(/-(light|dark)(-narrow)?\.svg$/, '')));
  assert.deepEqual([...names].sort(), [...charts].sort());
});

test('every embed carries intrinsic sizes and no lazy loading', () => {
  for (const fig of figures()) {
    assert.equal((fig.match(/<source [^>]*width="\d+" height="\d+"/g) ?? []).length, 2);
    assert.equal((fig.match(/<img [^>]*width="\d+" height="\d+"/g) ?? []).length, 2);
    assert.ok(!fig.includes('loading='));
  }
});

test('chart labels use the agreed wording', () => {
  const svg = readFileSync(`${CHART_DIR}/spend-billing-light.svg`, 'utf8');
  assert.ok(svg.includes('Opus 4.7 average = 100'));
  assert.ok(readFileSync(`${CHART_DIR}/context-bars-light.svg`, 'utf8').includes('>1M<'));
});

test('the essay no longer carries the Option B comparison scaffolding', () => {
  for (const essay of ESSAYS.filter(existsSync).map((f) => readFileSync(f, 'utf8'))) {
    assert.ok(!essay.includes('Option B'));
    assert.ok(!essay.includes('chart-note'));
  }
});

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (c) => {
  const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

test('palette contrast: text on paper >= 4.5, series on own band tint >= 3', () => {
  for (const [name, T] of Object.entries(THEMES)) {
    const paper = rgb(T.paper);
    for (const text of ['ink', 'muted']) assert.ok(ratio(rgb(T[text]), paper) >= 4.5, `${name} ${text} on paper`);
    T.hues.forEach((hue, i) => {
      const band = blend(rgb(hue), paper, T.bandOpacities[i]);
      assert.ok(ratio(rgb(hue), band) >= 3, `${name} series ${i + 1} on its band`);
    });
  }
});
