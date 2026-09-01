export type Platform = 'spotify' | 'apple-music'
export type JobStatus = 'PENDING' | 'ANALYZING' | 'MATCHING' | 'TRANSFERRING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'

export const accounts = [
  { id: 'acc_spotify', platform: 'spotify' as Platform, name: 'Spotify', connected: true, platformUserId: 'spotify_user_demo', userDisplayName: 'Sounmix Spotify User', scopes: ['playlist-read-private', 'playlist-modify-private', 'user-library-read'] },
  { id: 'acc_apple', platform: 'apple-music' as Platform, name: 'Apple Music', connected: true, platformUserId: 'apple_user_demo', userDisplayName: 'Sounmix Apple Music User', scopes: ['music-library'] },
]

export const playlists = [
  { id: 'pl_1', platform: 'spotify' as Platform, platformPlaylistId: 'spotify_chill', name: 'Chill Hits', description: 'Late night relaxed songs', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300', trackCount: 247, owner: 'You', isPublic: false },
  { id: 'pl_2', platform: 'spotify' as Platform, platformPlaylistId: 'spotify_workout', name: 'Workout Power', description: 'High energy tracks', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300', trackCount: 183, owner: 'You', isPublic: true },
  { id: 'pl_3', platform: 'apple-music' as Platform, platformPlaylistId: 'apple_favorites', name: 'Favorites All Time', description: 'All-time favorites', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', trackCount: 512, owner: 'You', isPublic: false },
  { id: 'pl_4', platform: 'apple-music' as Platform, platformPlaylistId: 'apple_roadtrip', name: 'Road Trip Jam', description: 'Driving playlist', imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300', trackCount: 96, owner: 'You', isPublic: false },
]

export const tracks = [
  { id: 'tr_1', platform: 'spotify' as Platform, platformTrackId: 'spotify_track_1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, isrc: 'USUG11904206', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
  { id: 'tr_2', platform: 'spotify' as Platform, platformTrackId: 'spotify_track_2', title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', durationMs: 215000, isrc: 'USUG12000658', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
  { id: 'tr_3', platform: 'spotify' as Platform, platformTrackId: 'spotify_track_3', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We’re Dreaming', durationMs: 244000, isrc: 'FRS631100304', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
  { id: 'tr_4', platform: 'spotify' as Platform, platformTrackId: 'spotify_track_4', title: 'As It Was', artist: 'Harry Styles', album: 'Harry’s House', durationMs: 167000, isrc: 'USSM12200612', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
  { id: 'tr_5', platform: 'apple-music' as Platform, platformTrackId: 'apple_track_1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, isrc: 'USUG11904206', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
  { id: 'tr_6', platform: 'apple-music' as Platform, platformTrackId: 'apple_track_2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', durationMs: 230000, isrc: 'USUG11601743', explicit: true, coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' },
]

export const playlistTracks = {
  pl_1: tracks.slice(0, 4),
  pl_2: tracks.slice(0, 3),
  pl_3: tracks.slice(0, 4),
  pl_4: tracks.slice(2, 4),
}

export const operations = [
  { id: 'op_1', type: 'TRANSFER', source: 'spotify', destination: 'apple-music', playlist: 'Chill Hits', status: 'COMPLETED' as JobStatus, totalTracks: 247, successfulTracks: 239, failedTracks: 3, startedAt: '2026-09-01T10:00:00.000Z', completedAt: '2026-09-01T10:08:00.000Z' },
  { id: 'op_2', type: 'DUPLICATE_REMOVE', source: 'apple-music', destination: null, playlist: 'Favorites All Time', status: 'COMPLETED' as JobStatus, totalTracks: 512, successfulTracks: 18, failedTracks: 0, startedAt: '2026-08-30T12:00:00.000Z', completedAt: '2026-08-30T12:03:00.000Z' },
]

export const jobs = new Map<string, { id: string; status: JobStatus; progress: { current: number; total: number; percent: number }; result?: unknown }>()

