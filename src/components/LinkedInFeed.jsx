import { useMemo, useState } from 'react';
import { collapsed } from './collapsed.js';

export { collapsed };

function fmtRelative(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.split(' ')[0] || raw;
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
  return `${Math.floor(diffDays / 365)}y`;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ai', label: 'AI', match: /ai\b|ai regulation|genai|claude|llm|artificial|governance/i },
  { key: 'engineering', label: 'Engineering', match: /engineer|code|kubernetes|java|kotlin|refactor|deploy|test|architecture/i },
  { key: 'career', label: 'Career', match: /career|team|leadership|mentor|role|job|hiring/i },
  { key: 'nordic', label: 'Nordic life', match: /oslo|norway|nordic|finn|vend|blocket|tori|dba/i },
];

function PostCard({ post, postId }) {
  const [expanded, setExpanded] = useState(false);
  const clean = (post.text || '').replace(/^["]|["]$/g, '').trim();
  const preview = collapsed(clean);
  const needsToggle = preview.length < clean.length;
  const display = expanded ? clean : preview;

  return (
    <article
      data-testid="feed-post"
      className="bg-paper dark:bg-[#1A1A1D] border border-rule dark:border-rule-dark rounded-xl overflow-hidden"
    >
      {/* Header — LinkedIn author strip */}
      <header className="flex items-start gap-3 px-6 pt-6 pb-3">
        <div className="w-12 h-12 rounded-full bg-linkedin/10 dark:bg-linkedin/20 flex items-center justify-center text-linkedin font-semibold shrink-0">
          AS
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-ink dark:text-ink-dark">Achint Satsangi</span>
            <span className="text-[13px] text-muted dark:text-muted-dark">· You</span>
          </div>
          <div className="text-[13px] text-muted dark:text-muted-dark">
            Senior Software Engineer at Vend Marketplaces
          </div>
          <div className="text-[12px] text-muted dark:text-muted-dark opacity-70 flex items-center gap-1 mt-0.5">
            {fmtRelative(post.date)} <span>·</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-2 4-3.08 6-3.08s5.97 1.08 6 3.08a7.2 7.2 0 0 1-6 3.22z"/></svg>
          </div>
        </div>
        <a
          href={post.link || 'https://linkedin.com/in/achint-satsangi/recent-activity/all/'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-linkedin shrink-0 [background-image:none]"
          title="View on LinkedIn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>
        </a>
      </header>

      {/* Body — preserved formatting */}
      <div className="px-6 pb-4">
        <p id={`post-body-${postId}`} className="text-[15px] leading-[1.55] whitespace-pre-line text-ink dark:text-ink-dark">
          {display}
          {needsToggle && !expanded && '…'}
          {needsToggle && (
            <>
              {' '}
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-muted dark:text-muted-dark hover:text-linkedin font-medium px-1 py-1 -mx-1 -my-1"
                aria-expanded={expanded}
                aria-controls={`post-body-${postId}`}
                data-testid="post-toggle"
              >
                {expanded ? 'see less' : 'see more'}
              </button>
            </>
          )}
        </p>
      </div>

      {post.images?.map((im, idx) => (
        <img
          key={idx}
          src={im.src}
          alt={im.alt}
          loading="lazy"
          className="w-full border-t border-rule dark:border-rule-dark"
        />
      ))}

      {post.link && (
        <footer className="border-t border-rule dark:border-rule-dark px-6 py-3 flex items-center justify-between text-[13px]">
          {post.article ? (
            <a
              href={post.article}
              target="_blank"
              rel="noopener noreferrer"
              className="text-linkedin font-medium"
            >
              ← Read article
            </a>
          ) : (
            <span />
          )}
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-linkedin font-medium"
          >
            Open on LinkedIn →
          </a>
        </footer>
      )}
    </article>
  );
}

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
      <div className="flex flex-wrap gap-3 mb-16" data-testid="feed-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            data-testid={`filter-${f.key}`}
            className={`px-5 py-2 text-sm font-medium rounded-full border transition-all
              ${filter === f.key
                ? 'bg-ink text-paper border-ink dark:bg-ink-dark dark:text-paper-dark dark:border-ink-dark'
                : 'border-rule dark:border-rule-dark text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-ink dark:hover:border-ink-dark'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-5xl mx-auto" data-testid="feed-posts">
        {filtered.map((p, i) => {
          const postId = (p.link ? p.link.replace(/[^a-zA-Z0-9]/g, '') : p.date) + '-' + i;
          return <PostCard key={p.link || `${p.date}-${i}`} post={p} postId={postId} />;
        })}
      </div>

      {filtered.length === 0 && (
        <p className="meta italic text-muted dark:text-muted-dark max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3" data-testid="feed-empty">
          Nothing matches that filter.
          <button
            onClick={() => setFilter('all')}
            className="not-italic font-medium text-accent dark:text-accent-dark px-2 py-1 -my-1"
            data-testid="feed-empty-reset"
          >
            Show all
          </button>
        </p>
      )}
    </div>
  );
}
