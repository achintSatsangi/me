import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import posts from '../data/linkedin-posts.json';

const TITLE_MAX_LENGTH = 90;

function titleOf(text: string) {
  const firstLine = text.replace(/^"|"$/g, '').trim().split('\n')[0];
  return firstLine.length <= TITLE_MAX_LENGTH ? firstLine : `${firstLine.slice(0, TITLE_MAX_LENGTH).replace(/\s+\S*$/, '')}…`;
}

export async function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const essays = (await getCollection('writing')).map((e) => ({
    title: e.data.title,
    pubDate: e.data.date,
    link: new URL(`${base}/writing/${e.id}/`, context.site!).toString(),
    description: e.data.description,
  }));
  const linkedinPosts = posts.map((p) => ({
    title: titleOf(p.text),
    pubDate: new Date(p.date.replace(' ', 'T') + 'Z'),
    link: p.link,
    description: p.text.replace(/^"|"$/g, '').trim(),
  }));
  return rss({
    title: 'Achint Satsangi',
    description: 'My essays and what I write on LinkedIn, newest first.',
    site: new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/`, context.site!).toString(),
    items: [...essays, ...linkedinPosts].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()),
  });
}
