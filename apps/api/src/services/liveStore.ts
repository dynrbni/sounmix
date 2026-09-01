export type Platform = 'spotify' | 'apple-music'

export interface ConnectedAccount {
  id: string
  platform: Platform
  name: string
  connected: boolean
  platformUserId?: string
  userDisplayName?: string
  email?: string
  profileImageUrl?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: number
  musicUserToken?: string
  scopes?: string[]
}

export interface LivePlaylist {
  id: string
  platform: Platform
  platformPlaylistId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  trackCount: number
  owner: string
  isPublic: boolean
  snapshotId?: string
}

export interface LiveTrack {
  id: string
  platform: Platform
  platformTrackId: string
  title: string
  artist: string
  album: string
  durationMs: number
  isrc?: string
  explicit?: boolean
  coverUrl?: string | null
  previewUrl?: string | null
  uri?: string
}

export interface TransferJob {
  id: string
  sourcePlatform: Platform
  destinationPlatform: Platform
  sourcePlaylistId: string
  destinationPlaylistId?: string
  playlistName: string
  status: 'PENDING' | 'ANALYZING' | 'MATCHING' | 'TRANSFERRING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'
  progress: {
    current: number
    total: number
    percent: number
  }
  result?: {
    matched: number
    uncertain: number
    unavailable: number
    matchedTracks?: { source: LiveTrack; destination?: LiveTrack; confidence: string }[]
    createdPlaylistId?: string
  }
  startedAt: string
  completedAt?: string
}

export interface OperationLog {
  id: string
  type: 'TRANSFER' | 'DUPLICATE_REMOVE' | 'ARTIST_MOVE' | 'PLAYLIST_MERGE'
  source: Platform
  destination?: Platform | null
  playlist: string
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'
  totalTracks: number
  successfulTracks: number
  failedTracks: number
  startedAt: string
  completedAt: string
}

class LiveStore {
  public accounts = new Map<Platform, ConnectedAccount>()
  public playlists = new Map<string, LivePlaylist>()
  public playlistTracks = new Map<string, LiveTrack[]>()
  public transferJobs = new Map<string, TransferJob>()
  public operations: OperationLog[] = []

  getAccount(platform: Platform): ConnectedAccount | undefined {
    return this.accounts.get(platform)
  }

  setAccount(platform: Platform, account: ConnectedAccount): void {
    this.accounts.set(platform, account)
  }

  removeAccount(platform: Platform): void {
    this.accounts.delete(platform)
  }

  getAllAccounts(): ConnectedAccount[] {
    const list: ConnectedAccount[] = [
      this.accounts.get('spotify') ?? {
        id: 'acc_spotify',
        platform: 'spotify',
        name: 'Spotify',
        connected: false,
      },
      this.accounts.get('apple-music') ?? {
        id: 'acc_apple',
        platform: 'apple-music',
        name: 'Apple Music',
        connected: false,
      },
    ]
    return list
  }

  setPlaylist(playlist: LivePlaylist, tracks?: LiveTrack[]): void {
    this.playlists.set(playlist.id, playlist)
    this.playlists.set(playlist.platformPlaylistId, playlist)
    if (tracks) {
      this.playlistTracks.set(playlist.id, tracks)
      this.playlistTracks.set(playlist.platformPlaylistId, tracks)
    }
  }

  getAllPlaylists(): LivePlaylist[] {
    return Array.from(new Map(Array.from(this.playlists.values()).map((p) => [p.platformPlaylistId, p])).values())
  }

  getPlaylistTracks(playlistId: string): LiveTrack[] | undefined {
    return this.playlistTracks.get(playlistId)
  }
}

export const liveStore = new LiveStore()
