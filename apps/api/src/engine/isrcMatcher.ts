export function matchByIsrc(sourceIsrc: string, targetIsrc: string): boolean {
  if (!sourceIsrc || !targetIsrc) return false
  return sourceIsrc.trim().toUpperCase() === targetIsrc.trim().toUpperCase()
}
