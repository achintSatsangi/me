// Truncate at the first sentence terminator after `minLen` that a word boundary follows; else word-cut.
export function collapsed(clean, minLen = 260) {
  if (!clean) return '';
  if (clean.length <= minLen) return clean;
  const rest = clean.slice(minLen);
  const sentenceMatch = rest.match(/^[\s\S]*?[.!?](?=\s|$)/);
  if (sentenceMatch) return clean.slice(0, minLen + sentenceMatch[0].length);
  const wordCut = clean.slice(0, minLen).replace(/\s+\S*$/, '');
  return wordCut.replace(/[\uD800-\uDBFF]$/, '');
}
