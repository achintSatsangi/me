import { useMemo, useState } from 'react';

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.split(' ')[0] || raw;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function preview(text, len = 480) {
  if (!text) return '';
  const clean = text.replace(/^["]|["]$/g, '').trim();
  if (clean.length <= len) return clean;
  return clean.slice(0, len).replace(/\s+\S*$/, '') + '…';
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ai', label: 'AI', match: /ai\b|ai regulation|genai|claude|llm|artificial|governance/i },
  { key: 'engineering', label: 'Engineering', match: /engineer|code|kubernetes|java|kotlin|refactor|deploy|test|architecture/i },
  { key: 'career', label: 'Career', match: /career|team|leadership|mentor|role|job|hiring/i },
  { key: 'nordic', label: 'Nordic life', match: /oslo|norway|nordic|finn|vend|blocket|tori|dba/i },
];

export default function LinkedInFeed({ posts }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return posts;
    const spec = FILTERS.find((f) => f.key === filter);
    if (!spec?.match) return posts;
    return posts.filter((p) => spec.match.test(p.text));
  }, [posts, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10" data-testid="feed-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            data-testid={`filter-${f.key}`}
            className={`px-4 py-1.5 text-xs uppercase tracking-[0.15em] font-medium rounded-full border transition-colors
              ${filter === f.key
                ? 'bg-ink text-paper border-ink dark:bg-ink-dark dark:text-paper-dark dark:border-ink-dark'
                : 'border-rule dark:border-rule-dark text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="columns-1 md:columns-2 gap-8 space-y-8" data-testid="feed-posts">
        {filtered.map((p, i) => (
          <article
            key={i}
            data-testid="feed-post"
            className="break-inside-avoid border-t border-rule dark:border-rule-dark pt-6 pb-2"
          >
            <div className="meta mb-3">{fmtDate(p.date)}</div>
            <p className="font-sans text-[15px] leading-relaxed whitespace-pre-line">{preview(p.text)}</p>
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="meta inline-block mt-4 text-rust dark:text-rust-dark"
              >
                Read on LinkedIn →
              </a>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="meta italic opacity-60" data-testid="feed-empty">No posts match that filter yet.</p>
      )}
    </div>
  );
}
