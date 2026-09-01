export interface SpotifyPlaylistDto { id: string; name: string; description: string; tracks: { total: number } }
export interface SpotifyTrackDto { id: string; name: string; artists: { name: string }[]; duration_ms: number; external_ids?: { isrc?: string } }
