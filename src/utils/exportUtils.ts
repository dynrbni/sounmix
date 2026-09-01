export function exportPlaylistToJson(playlist: any) {
  return JSON.stringify(playlist, null, 2)
}
