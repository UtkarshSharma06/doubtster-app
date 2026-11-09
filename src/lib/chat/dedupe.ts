/**
 * Computes n-gram Jaccard overlap between candidate text and previous assistant responses.
 */
function getNGrams(text: string, n = 3): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const ngrams = new Set<string>();
  if (words.length < n) {
    if (words.length > 0) ngrams.add(words.join(" "));
    return ngrams;
  }

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }

  return ngrams;
}

export function computeOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = getNGrams(a, 3);
  const setB = getNGrams(b, 3);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

export function isTooSimilar(
  candidateText: string,
  previousAssistantMessages: string[],
  threshold = 0.85
): { duplicate: boolean; score: number; matchedIndex: number } {
  let maxScore = 0;
  let matchedIndex = -1;

  for (let i = 0; i < previousAssistantMessages.length; i++) {
    const prev = previousAssistantMessages[i];
    const score = computeOverlap(candidateText, prev);
    if (score > maxScore) {
      maxScore = score;
      matchedIndex = i;
    }
  }

  return {
    duplicate: maxScore >= threshold,
    score: maxScore,
    matchedIndex,
  };
}

