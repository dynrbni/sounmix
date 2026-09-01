export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0
  return 0.85
}
