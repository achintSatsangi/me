const WORDS_PER_MINUTE = 230;

export function readingMinutes(markdown) {
  const words = markdown
    .replace(/<figure[\s\S]*?<\/figure>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
