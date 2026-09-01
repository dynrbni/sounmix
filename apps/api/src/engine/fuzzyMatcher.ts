import { levenshteinDistance } from './levenshtein.js'
export function matchFuzzy(t1: string, t2: string, threshold = 0.8): boolean {
  const maxLen = Math.max(t1.length, t2.length)
  if (maxLen === 0) return true
  const dist = levenshteinDistance(t1.toLowerCase(), t2.toLowerCase())
  return (1 - dist / maxLen) >= threshold
}
