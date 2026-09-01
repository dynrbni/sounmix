export type MatchConfidence = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNMATCHED'
export function calculateConfidence(score: number): MatchConfidence {
  if (score >= 0.95) return 'EXACT'
  if (score >= 0.8) return 'HIGH'
  if (score >= 0.6) return 'MEDIUM'
  return 'LOW'
}
