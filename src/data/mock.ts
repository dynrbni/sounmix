export type Platform = 'Spotify' | 'Apple Music'

export type Track = {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  isrc: string
}

export type Playlist = {
  id: string
  platform: Platform
  name: string
  description: string
  tracks: number
  owner: string
  visibility: 'Public' | 'Private'
}

export type Operation = {
  id: string
  type: string
  playlist: string
  route: string
  status: 'Completed' | 'Matching' | 'Needs review' | 'Pending' | 'Cancelled'
  total: number
  success: number
  failed: number
  date: string
}

export const playlists: Playlist[] = [
  { id: '1', platform: 'Spotify', name: 'Chill', description: 'Late night relaxed songs', tracks: 247, owner: 'You', visibility: 'Private' },
  { id: '2', platform: 'Spotify', name: 'Workout', description: 'High energy tracks', tracks: 183, owner: 'You', visibility: 'Public' },
  { id: '3', platform: 'Apple Music', name: 'Favorites', description: 'All-time favorites', tracks: 512, owner: 'You', visibility: 'Private' },
  { id: '4', platform: 'Apple Music', name: 'Road Trip', description: 'Driving playlist', tracks: 96, owner: 'You', visibility: 'Private' },
  { id: '5', platform: 'Spotify', name: 'My Music', description: 'Mixed library dump', tracks: 421, owner: 'You', visibility: 'Private' },
]

export const duplicateTracks: Track[] = [
  { id: 'd1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', isrc: 'USUG11904206' },
  { id: 'd2', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', isrc: 'USUG11904206' },
  { id: 'd3', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: '3:50', isrc: 'USUG11600995' },
  { id: 'd4', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: '3:50', isrc: 'USUG11600995' },
]

export const artistTracks: Track[] = [
  { id: 'a1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', isrc: 'USUG11904206' },
  { id: 'a2', title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', duration: '3:35', isrc: 'USUG12000658' },
  { id: 'a3', title: 'The Hills', artist: 'The Weeknd', album: 'Beauty Behind the Madness', duration: '4:02', isrc: 'USUG11500737' },
]

export const unmatchedTracks = ['Song A — Artist A', 'Song B — Artist B', 'Song C — Artist C']

export const operations: Operation[] = [
  { id: '1', type: 'Transfer', playlist: 'Chill', route: 'Spotify → Apple Music', status: 'Completed', total: 247, success: 239, failed: 3, date: 'Sep 1' },
  { id: '2', type: 'Duplicate Cleanup', playlist: 'Favorites', route: 'Apple Music', status: 'Completed', total: 512, success: 18, failed: 0, date: 'Aug 30' },
  { id: '3', type: 'Artist Organizer', playlist: 'My Music', route: 'Spotify', status: 'Needs review', total: 17, success: 17, failed: 0, date: 'Aug 28' },
]
