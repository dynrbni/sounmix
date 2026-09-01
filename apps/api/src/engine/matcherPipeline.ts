import { matchByIsrc } from './isrcMatcher.js'
import { matchMetadata } from './metadataMatcher.js'
import { matchFuzzy } from './fuzzyMatcher.js'
export function matchTrack(source: any, candidates: any[]) {
  for (const c of candidates) {
    if (matchByIsrc(source.isrc, c.isrc)) return { match: c, method: 'ISRC', confidence: 1.0 }
  }
  for (const c of candidates) {
    if (matchMetadata(source, c)) return { match: c, method: 'METADATA', confidence: 0.95 }
  }
  for (const c of candidates) {
    if (matchFuzzy(source.title, c.title)) return { match: c, method: 'FUZZY', confidence: 0.8 }
  }
  return null
}
