// Lightweight hint masking helpers used by the HintSystem and adaptive feedback
export type SpoilerLevel = 'low' | 'medium' | 'high'

export function maskWord(word: string, revealFirst = 1): string {
  if (!word) return word
  const len = word.length
  const visible = Math.max(0, Math.min(revealFirst, len))
  const masked = '_'.repeat(Math.max(1, len - visible))
  return word.slice(0, visible) + masked
}

export function maskSentence(text: string, revealWords = 1): string {
  if (!text) return text
  const words = text.split(/\s+/)
  if (words.length <= revealWords) return words.map(w => maskWord(w, 1)).join(' ')
  return words
    .map((w, i) => (i < revealWords ? w : '_'.repeat(Math.max(1, w.length))))
    .join(' ')
}

export function maskForLevel(text: string, level: SpoilerLevel) {
  if (!text) return text
  // If single word answer, reveal more letters progressively
  if (!/\s+/.test(text)) {
    if (level === 'low') return maskWord(text, 1)
    if (level === 'medium') return maskWord(text, 2)
    return maskWord(text, Math.max(2, Math.ceil(text.length / 3)))
  }

  // Multi-word answers: reveal some words
  if (level === 'low') return maskSentence(text, 0)
  if (level === 'medium') return maskSentence(text, 1)
  return maskSentence(text, Math.max(1, Math.floor(text.split(/\s+/).length / 2)))
}
