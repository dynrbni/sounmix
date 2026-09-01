import { config } from '../config/env.js'
import { liveStore, type ConnectedAccount, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class SpotifyService {
  private get clientId(): string {
    return config.spotify.clientId || 'demo_spotify_client_id'
  }

  private get clientSecret(): string {
    return config.spotify.clientSecret || 'demo_spotify_client_secret'
  }

  private get redirectUri(): string {
    return config.spotify.redirectUri
  }

  getAuthUrl(state = 'sounmix_auth'): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: config.spotify.scopes,
      redirect_uri: this.redirectUri,
      state,
      show_dialog: 'true',
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<ConnectedAccount> {
    if (!config.spotify.clientId || !config.spotify.clientSecret) {
      // In dev fallback mode if credentials aren't configured yet
      const fallbackAccount: ConnectedAccount = {
        id: 'acc_spotify',
        platform: 'spotify',
        name: 'Spotify',
        connected: true,
        platformUserId: 'spotify_user_live',
        userDisplayName: 'Spotify User',
        scopes: config.spotify.scopes.split(' '),
      }
      liveStore.setAccount('spotify', fallbackAccount)
      return fallbackAccount
    }

    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Spotify token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token as string
    const refreshToken = tokenData.refresh_token as string
    const expiresIn = (tokenData.expires_in as number) || 3600
    const tokenExpiresAt = Date.now() + expiresIn * 1000

    const userProfile = await this.fetchUserProfile(accessToken)

    const account: ConnectedAccount = {
      id: `acc_spotify_${userProfile.id}`,
      platform: 'spotify',
      name: 'Spotify',
      connected: true,
      platformUserId: userProfile.id,
      userDisplayName: userProfile.display_name || userProfile.id,
      email: userProfile.email,
      profileImageUrl: userProfile.images?.[0]?.url,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scopes: (tokenData.scope as string)?.split(' ') || [],
    }

    liveStore.setAccount('spotify', account)
    return account
  }

  async getValidToken(): Promise<string | null> {
    const account = liveStore.getAccount('spotify')
    if (!account || !account.connected) {
      return null
    }

    if (!account.accessToken) {
      return 'demo_token'
    }

    // Refresh if expiring within 60 seconds
    if (account.tokenExpiresAt && Date.now() > account.tokenExpiresAt - 60000 && account.refreshToken) {
      return this.refreshToken(account)
    }

    return account.accessToken
  }

  private async refreshToken(account: ConnectedAccount): Promise<string> {
    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken!,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Spotify access token')
    }

    const data = await response.json()
    account.accessToken = data.access_token
    if (data.refresh_token) {
      account.refreshToken = data.refresh_token
    }
    account.tokenExpiresAt = Date.now() + ((data.expires_in as number) || 3600) * 1000
    liveStore.setAccount('spotify', account)

    return account.accessToken!
  }

  private async fetchUserProfile(accessToken: string): Promise<any> {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new Error('Failed to fetch Spotify user profile')
    }

    return res.json()
  }

  async getUserPlaylists(): Promise<LivePlaylist[]> {
    const token = await this.getValidToken()
    if (!token || token === 'demo_token') {
      const account = liveStore.getAccount('spotify')
      if (!account?.connected) return []
      return [
        { id: 'pl_spot_1', platform: 'spotify', platformPlaylistId: 'spot_1', name: 'My Favorite Hits', trackCount: 42, owner: account.userDisplayName || 'You', isPublic: false, imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
        { id: 'pl_spot_2', platform: 'spotify', platformPlaylistId: 'spot_2', name: 'Workout Energy', trackCount: 28, owner: account.userDisplayName || 'You', isPublic: true, imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
      ]
    }

    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch playlists from Spotify API')
    }

    const data = await response.json()
    const items = (data.items || []) as any[]

    return items.map((item) => ({
      id: `spotify_${item.id}`,
      platform: 'spotify',
      platformPlaylistId: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.images?.[0]?.url || null,
      trackCount: item.tracks?.total || 0,
      owner: item.owner?.display_name || 'You',
      isPublic: Boolean(item.public),
      snapshotId: item.snapshot_id,
    }))
  }

  async getPlaylistTracks(platformPlaylistId: string): Promise<LiveTrack[]> {
    const token = await this.getValidToken()
    const cleanId = platformPlaylistId.replace(/^spotify_/, '')

    if (!token || token === 'demo_token') {
      return [
        { id: `tr_${cleanId}_1`, platform: 'spotify', platformTrackId: 'spotify_track_1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, isrc: 'USUG11904206', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b' },
        { id: `tr_${cleanId}_2`, platform: 'spotify', platformTrackId: 'spotify_track_2', title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', durationMs: 215000, isrc: 'USUG12000658', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300', uri: 'spotify:track:5QO79kh1waicV47BqGRL3g' },
        { id: `tr_${cleanId}_3`, platform: 'spotify', platformTrackId: 'spotify_track_3', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We’re Dreaming', durationMs: 244000, isrc: 'FRS631100304', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300', uri: 'spotify:track:1eyzqe2QqGZUmfcPZtrIyt' },
      ]
    }

    const response = await fetch(`https://api.spotify.com/v1/playlists/${cleanId}/tracks?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch tracks for playlist ${cleanId} from Spotify API`)
    }

    const data = await response.json()
    const items = (data.items || []) as any[]

    return items
      .filter((item) => item.track && item.track.id)
      .map((item) => {
        const track = item.track
        return {
          id: `sp_tr_${track.id}`,
          platform: 'spotify',
          platformTrackId: track.id,
          title: track.name,
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          durationMs: track.duration_ms || 0,
          isrc: track.external_ids?.isrc,
          explicit: Boolean(track.explicit),
          coverUrl: track.album?.images?.[0]?.url || null,
          uri: track.uri,
        }
      })
  }

  async searchTrack(query: string, isrc?: string): Promise<LiveTrack[]> {
    const token = await this.getValidToken()
    if (!token || token === 'demo_token') {
      return []
    }

    const q = isrc ? `isrc:${isrc}` : query
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) return []
    const data = await response.json()
    const items = data.tracks?.items || []

    return items.map((track: any) => ({
      id: `sp_tr_${track.id}`,
      platform: 'spotify',
      platformTrackId: track.id,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || '',
      durationMs: track.duration_ms || 0,
      isrc: track.external_ids?.isrc,
      explicit: Boolean(track.explicit),
      coverUrl: track.album?.images?.[0]?.url || null,
      uri: track.uri,
    }))
  }

  async createPlaylist(name: string, description = 'Created with Sounmix', isPublic = false): Promise<LivePlaylist> {
    const token = await this.getValidToken()
    const account = liveStore.getAccount('spotify')
    const userId = account?.platformUserId || 'me'

    if (!token || token === 'demo_token') {
      return {
        id: `pl_spotify_${Date.now()}`,
        platform: 'spotify',
        platformPlaylistId: `spot_created_${Date.now()}`,
        name,
        description,
        trackCount: 0,
        owner: 'You',
        isPublic,
      }
    }

    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, public: isPublic }),
    })

    if (!response.ok) {
      throw new Error('Failed to create playlist on Spotify')
    }

    const item = await response.json()
    return {
      id: `spotify_${item.id}`,
      platform: 'spotify',
      platformPlaylistId: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.images?.[0]?.url || null,
      trackCount: 0,
      owner: item.owner?.display_name || 'You',
      isPublic: Boolean(item.public),
    }
  }

  async addTracksToPlaylist(platformPlaylistId: string, trackUris: string[]): Promise<boolean> {
    const token = await this.getValidToken()
    const cleanId = platformPlaylistId.replace(/^spotify_/, '')

    if (!token || token === 'demo_token') return true

    // Spotify allows max 100 tracks per request
    const batchSize = 100
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize)
      const res = await fetch(`https://api.spotify.com/v1/playlists/${cleanId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: batch }),
      })

      if (!res.ok) {
        throw new Error(`Failed to add tracks to Spotify playlist: ${await res.text()}`)
      }
    }

    return true
  }

  async removeTracksFromPlaylist(platformPlaylistId: string, trackUris: string[]): Promise<boolean> {
    const token = await this.getValidToken()
    const cleanId = platformPlaylistId.replace(/^spotify_/, '')

    if (!token || token === 'demo_token') return true

    const tracksObj = trackUris.map((uri) => ({ uri }))
    const res = await fetch(`https://api.spotify.com/v1/playlists/${cleanId}/tracks`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tracks: tracksObj }),
    })

    return res.ok
  }
}

export const spotifyService = new SpotifyService()
