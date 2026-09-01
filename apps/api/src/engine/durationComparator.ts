export function isDurationWithinTolerance(d1Ms: number, d2Ms: number, toleranceMs = 4000): boolean {
  return Math.abs(d1Ms - d2Ms) <= toleranceMs
}
