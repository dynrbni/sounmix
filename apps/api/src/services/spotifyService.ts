import { config } from '../config/env.js'
import { liveStore, type ConnectedAccount, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class SpotifyService {
  private get clientId(): string {
    return config.spotify.clientId
  }

  private get clientSecret(): string {
    return config.spotify.clientSecret
  }

  private get redirectUri(): string {
    return config.spotify.redirectUri
  }

  getAuthUrl(state = 'sounmix_auth'): string {
    if (!this.clientId) {
      throw new Error('SPOTIFY_CLIENT_ID is not configured in apps/api/.env')
    }

    const query = [
      `response_type=code`,
      `client_id=${encodeURIComponent(this.clientId.trim())}`,
      `scope=${encodeURIComponent(config.spotify.scopes)}`,
      `redirect_uri=${encodeURIComponent(this.redirectUri.trim())}`,
      `state=${encodeURIComponent(state)}`,
    ].join('&')

    return `https://accounts.spotify.com/authorize?${query}`
  }


  async exchangeCode(code: string): Promise<ConnectedAccount> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify Client ID or Secret is missing in apps/api/.env')
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
    if (!account || !account.connected || !account.accessToken) {
      return null
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
    if (!token) {
      return []
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
    if (!token) {
      return []
    }

    const cleanId = platformPlaylistId.replace(/^spotify_/, '')
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
    if (!token) {
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
    if (!token) {
      throw new Error('Cannot create playlist: Spotify account is not connected')
    }

    const account = liveStore.getAccount('spotify')
    const userId = account?.platformUserId || 'me'

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
    if (!token) {
      throw new Error('Cannot add tracks: Spotify account is not connected')
    }

    const cleanId = platformPlaylistId.replace(/^spotify_/, '')

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
    if (!token) {
      throw new Error('Cannot remove tracks: Spotify account is not connected')
    }

    const cleanId = platformPlaylistId.replace(/^spotify_/, '')
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
