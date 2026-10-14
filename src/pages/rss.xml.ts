import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import posts from '../data/linkedin-posts.json';

const TITLE_MAX_LENGTH = 90;

function titleOf(text: string) {
  const firstLine = text.replace(/^"|"$/g, '').trim().split('\n')[0];
  return firstLine.length <= TITLE_MAX_LENGTH ? firstLine : `${firstLine.slice(0, TITLE_MAX_LENGTH).replace(/\s+\S*$/, '')}…`;
}

export function GET(context: APIContext) {
  return rss({
    title: 'Achint Satsangi',
    description: 'What I write on LinkedIn, in full, newest first.',
    site: new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/`, context.site!).toString(),
    items: posts.map((p) => ({
      title: titleOf(p.text),
      pubDate: new Date(p.date.replace(' ', 'T') + 'Z'),
      link: p.link,
      description: p.text.replace(/^"|"$/g, '').trim(),
    })),
  });
}
