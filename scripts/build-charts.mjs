import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { CHARTS } from './charts.mjs';
import { THEMES } from './chart-theme.mjs';

const OUT = 'public/images/charts';
const LAYOUTS = {
  wide: { w: 640, font: 14, left: 64, right: 16, top: 62, plotH: 240, keyRow: 22 },
  narrow: { w: 280, font: 13, left: 58, right: 22, top: 62, plotH: 275, keyRow: 18 },
};
const DAY = 86400000;
const days = (iso) => Math.round(Date.parse(iso) / DAY);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (iso) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (n) => Math.round(n * 10) / 10;

function frame(layout, theme, height, body) {
  const { w, font } = LAYOUTS[layout];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${height}" width="${w}" height="${height}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif" font-size="${font}" aria-hidden="true">\n${body}</svg>\n`;
}

const bandLabelChoices = [['Opus 4.7', '1'], ['Capped', '2'], ['After update', 'After', '3']];

function render({ layout, theme, bars, colourByBand, first, last, yMax, yStep, yFormat, yTitle, series, bands, mean, markers, guide, xTicks, key }) {
  const L = LAYOUTS[layout];
  const T = THEMES[theme];
  const plotW = L.w - L.left - L.right;
  const span = days(last) - days(first) + 1;
  const x = (iso) => L.left + ((days(iso) - days(first) + 0.5) / span) * plotW;
  const edge = (iso, offset) => L.left + ((days(iso) - days(first) + offset) / span) * plotW;
  const y = (v) => L.top + L.plotH - (v / yMax) * L.plotH;
  const bottom = L.top + L.plotH;
  const keyLines = key[layout];
  const height = bottom + 34 + keyLines.length * L.keyRow + 8;
  const o = [];
  const bandIndex = (iso) => Math.max(0, bands.findIndex((b) => iso >= b.from && iso <= b.to));
  const splitByBand = (seg) => {
    const runs = [];
    seg.forEach((p, i) => {
      const index = bandIndex(p.date);
      if (!runs.length || runs.at(-1).index !== index) runs.push({ index, tone: T.hues[index], points: i ? [seg[i - 1]] : [] });
      runs.at(-1).points.push(p);
    });
    return runs;
  };

  if (bands) {
    bands.forEach((b, i) => {
      const x0 = edge(b.from, 0);
      const x1 = edge(b.to, 1);
      o.push(`<rect x="${fmt(x0)}" y="${L.top}" width="${fmt(x1 - x0)}" height="${L.plotH}" fill="${T.hues[i]}" fill-opacity="${T.bandOpacities[i]}"/>`);
      o.push(`<text x="${fmt((x0 + x1) / 2)}" y="${L.top - 8}" text-anchor="middle" fill="${T.ink}" font-weight="600">${esc(bandLabelChoices[i].find((t) => t.length === 1 || t.length * L.font * 0.6 + 8 <= x1 - x0))}</text>`);
    });
  }
  for (let v = 0; v <= yMax; v += yStep) {
    o.push(`<line x1="${L.left}" x2="${L.w - L.right}" y1="${fmt(y(v))}" y2="${fmt(y(v))}" stroke="${T.rule}" stroke-width="1"/>`);
    o.push(`<text x="${L.left - 8}" y="${fmt(y(v) + 4.5)}" text-anchor="end" fill="${T.muted}">${yFormat(v)}</text>`);
  }
  o.push(`<line x1="${L.left}" x2="${L.w - L.right}" y1="${bottom}" y2="${bottom}" stroke="${T.muted}" stroke-width="1"/>`);
  (Array.isArray(xTicks) ? xTicks : xTicks[layout]).forEach((iso) => {
    o.push(`<line x1="${fmt(x(iso))}" x2="${fmt(x(iso))}" y1="${bottom}" y2="${bottom + 5}" stroke="${T.muted}" stroke-width="1"/>`);
    o.push(`<text x="${fmt(x(iso))}" y="${bottom + 22}" text-anchor="middle" fill="${T.muted}">${label(iso)}</text>`);
  });
  o.push(`<text transform="translate(14 ${fmt(L.top + L.plotH / 2)}) rotate(-90)" text-anchor="middle" fill="${T.muted}">${esc(yTitle[layout])}</text>`);

  if (mean) {
    bands.forEach((b, i) => {
      o.push(`<line x1="${fmt(edge(b.from, 0))}" x2="${fmt(edge(b.to, 1))}" y1="${fmt(y(mean[i]))}" y2="${fmt(y(mean[i]))}" stroke="${T.hues[i]}" stroke-width="3"/>`);
    });
  }
  markers.forEach((m) => {
    const mx = fmt(x(m.date));
    o.push(`<line x1="${mx}" x2="${mx}" y1="${L.top - 24}" y2="${bottom}" stroke="${T.ink}" stroke-width="${m.solid ? 2 : 1.5}"${m.solid ? '' : ' stroke-dasharray="2 3"'}/>`);
    const lines = m.lines[layout];
    const gap = m.side === 'left' ? -6 : 6;
    lines.forEach((line, i) => {
      const ly = L.top - 30 - (lines.length - 1 - i) * (L.font + 2) + (m.lowered ?? 0);
      o.push(`<text x="${fmt(Number(mx) + gap)}" y="${ly}" text-anchor="${m.side === 'left' ? 'end' : 'start'}" fill="${T.ink}">${esc(line)}</text>`);
    });
  });
  if (bars) {
    const slot = plotW / span;
    const barShare = layout === 'narrow' ? 0.58 : 0.7;
    series[0].forEach((p) => {
      const top = y(p.value);
      const tone = T.hues[bandIndex(p.date)];
      o.push(`<rect x="${fmt(x(p.date) - (slot * barShare) / 2)}" y="${fmt(top)}" width="${fmt(slot * barShare)}" height="${fmt(bottom - top)}" fill="${tone}"/>`);
    });
  } else series.forEach((seg) => {
    const runs = colourByBand ? splitByBand(seg) : [{ tone: T.ink, points: seg }];
    runs.forEach((run) => {
      const pts = run.points.map((p) => `${fmt(x(p.date))},${fmt(y(p.value))}`).join(' ');
      o.push(`<polyline points="${pts}" fill="none" stroke="${run.tone ?? T.ink}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
    });
  });
  if (guide) {
    o.push(`<line x1="${L.left}" x2="${L.w - L.right}" y1="${fmt(y(guide.value))}" y2="${fmt(y(guide.value))}" stroke="${T.ink}" stroke-width="2" stroke-dasharray="8 4"/>`);
    o.push(`<text x="${L.w - L.right - 4}" y="${fmt(y(guide.value) - 7)}" text-anchor="end" fill="${T.ink}" font-weight="600" stroke="${T.paper}" stroke-width="4" stroke-linejoin="round" paint-order="stroke">${esc(guide.label[layout])}</text>`);
  }
  keyLines.forEach((line, i) => {
    const ky = bottom + 34 + 14 + i * L.keyRow - 4;
    const x0 = layout === 'narrow' ? 4 : L.left - 8;
    if (line.swatch !== undefined) o.push(`<rect x="${x0}" y="${ky - 11}" width="12" height="12" rx="2" fill="${T.hues[line.swatch]}"/>`);
    o.push(`<text x="${x0 + 18}" y="${ky}" fill="${line.indent ? T.muted : T.ink}">${esc(line.text)}</text>`);
  });
  return frame(layout, theme, height, o.join('\n') + '\n');
}

const write = (name, layout, theme, svg) => writeFileSync(`${OUT}/${name}-${theme}${layout === 'narrow' ? '-narrow' : ''}.svg`, svg);
mkdirSync(OUT, { recursive: true });
const wanted = new Set(CHARTS.map((c) => c.name));
for (const file of readdirSync(OUT)) {
  const name = file.match(/^(.*)-(?:light|dark)(?:-narrow)?\.svg$/)?.[1];
  if (!wanted.has(name)) rmSync(`${OUT}/${file}`);
}

const spend = JSON.parse(readFileSync('src/data/chart-spend-billing.json', 'utf8'));
const byPeriod = (p) => spend.filter((r) => r.period === p);
const periodBounds = ['A', 'B', 'C'].map((p) => ({ from: byPeriod(p)[0].date, to: byPeriod(p).at(-1).date }));
const periodMean = ['A', 'B', 'C'].map((p) => byPeriod(p).reduce((s, r) => s + r.index, 0) / byPeriod(p).length);
const segments = [];
spend.forEach((r, i) => {
  const point = { date: r.date, value: r.index };
  if (i === 0 || days(r.date) - days(spend[i - 1].date) > 1) segments.push([point]);
  else segments.at(-1).push(point);
});
const avg = (i) => Math.round(periodMean[i]);
const yTitleText = 'Daily billed spend (Opus 4.7 average = 100)';

const spendBillingChart = {
  first: spend[0].date,
  last: spend.at(-1).date,
  yMax: 400,
  yStep: 100,
  yFormat: String,
  yTitle: { wide: yTitleText, narrow: yTitleText },
  series: segments,
  bands: periodBounds,
  mean: periodMean,
  markers: [
    { date: '2026-10-02', side: 'left', solid: true, lines: { wide: ['Claude Code 2.1.287'], narrow: ['Claude Code', '2.1.287'] } },
    { date: '2026-10-03', side: 'right', lines: { wide: ['Habits start'], narrow: ['Habits', 'start'] } },
  ],
  xTicks: ['2026-09-01', '2026-09-15', '2026-10-01'],
  key: {
    wide: [
      { text: `1  Opus 4.7 (1M window), 25 Aug–25 Sep, average ${avg(0)}`, swatch: 0 },
      { text: `2  Opus 4.8 and 5.5, before 3 October, 27 Sep–2 Oct, average ${avg(1)}`, swatch: 1 },
      { text: `3  Opus 5.5, from 3 October, 3–14 Oct, average ${avg(2)}`, swatch: 2 },
    ],
    narrow: [
      { text: '1  Opus 4.7 (1M window)', swatch: 0 },
      { text: `25 Aug–25 Sep, average ${avg(0)}`, indent: true },
      { text: '2  Opus 4.8 and 5.5, before 3 October', swatch: 1 },
      { text: `27 Sep–2 Oct, average ${avg(1)}`, indent: true },
      { text: '3  Opus 5.5, from 3 October', swatch: 2 },
      { text: `3–14 Oct, average ${avg(2)}`, indent: true },
    ],
  },
};

const context = JSON.parse(readFileSync('src/data/chart-context.json', 'utf8'));
const contextChart = {
  first: context[0].date,
  last: context.at(-1).date,
  yMax: 1000,
  yStep: 200,
  yFormat: (v) => (v === 0 ? '0' : v === 1000 ? '1M' : `${v}k`),
  yTitle: { wide: 'Largest context per day (tokens)', narrow: 'Largest context per day (tokens)' },
  colourByBand: true,
  series: [context.map((r) => ({ date: r.date, value: r.tokens / 1000 }))],
  bands: [
    { from: '2026-09-08', to: '2026-09-26' },
    { from: '2026-09-27', to: '2026-10-01' },
    { from: '2026-10-02', to: '2026-10-14' },
  ],
  guide: { value: 167, label: { wide: '167k compaction point', narrow: '167k' } },
  markers: [
    { date: '2026-09-27', side: 'left', lines: { wide: ['Model switch'], narrow: ['Model', 'switch'] } },
    { date: '2026-10-02', side: 'right', solid: true, lines: { wide: ['Claude Code 2.1.287'], narrow: ['Claude Code', '2.1.287'] } },
  ],
  xTicks: {
    wide: ['2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29', '2026-10-06', '2026-10-13'],
    narrow: ['2026-09-08', '2026-09-22', '2026-10-06'],
  },
  key: {
    wide: [
      { text: '1  Opus 4.7 (1M window), 8–26 Sep', swatch: 0 },
      { text: '2  Opus 4.8/5.5, 200k cap, 27 Sep–1 Oct', swatch: 1 },
      { text: '3  Opus 5.5 after 2.1.287, 2–14 Oct', swatch: 2 },
    ],
    narrow: [
      { text: '1  Opus 4.7 (1M window)', swatch: 0 },
      { text: '8–26 Sep', indent: true },
      { text: '2  Opus 4.8/5.5, 200k cap', swatch: 1 },
      { text: '27 Sep–1 Oct', indent: true },
      { text: '3  Opus 5.5 after 2.1.287', swatch: 2 },
      { text: '2–14 Oct', indent: true },
      { text: 'Dashed line: 167k compaction point', indent: true },
    ],
  },
};

const contextBars = {
  ...contextChart,
  bars: true,
  series: [contextChart.series[0]],
};

const definitions = { 'spend-billing': spendBillingChart, 'context-bars': contextBars };

for (const theme of Object.keys(THEMES)) {
  for (const layout of Object.keys(LAYOUTS)) {
    for (const { name } of CHARTS) write(name, layout, theme, render({ layout, theme, ...definitions[name] }));
  }
}
