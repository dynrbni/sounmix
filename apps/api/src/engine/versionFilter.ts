export function cleanTrackTitle(title: string): string {
  return title.replace(/\s*\((remastered|live|deluxe|acoustic).*?\)/gi, '').replace(/\s*-\s*(remastered|live|deluxe|acoustic).*?$/gi, '').trim()
}
