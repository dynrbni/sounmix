export interface AppleMusicPlaylistDto { id: string; attributes: { name: string; description?: { standard: string } } }
export interface AppleMusicTrackDto { id: string; attributes: { name: string; artistName: string; isrc?: string; durationInMillis: number } }
