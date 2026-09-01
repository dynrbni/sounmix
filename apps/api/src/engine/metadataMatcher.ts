import { normalizeString } from './normalizer.js'
export function matchMetadata(t1: { title: string; artist: string }, t2: { title: string; artist: string }): boolean {
  return normalizeString(t1.title) === normalizeString(t2.title) && normalizeString(t1.artist) === normalizeString(t2.artist)
}
