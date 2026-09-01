import { config } from '../config/env.js'
import { liveStore, type ConnectedAccount, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class AppleMusicService {
  private get developerToken(): string {
    return config.appleMusic.developerToken || 'demo_apple_dev_token'
  }

  async connectAccount(musicUserToken: string, storefront = 'us'): Promise<ConnectedAccount> {
    const account: ConnectedAccount = {
      id: `acc_apple_${Date.now()}`,
      platform: 'apple-music',
      name: 'Apple Music',
      connected: true,
      musicUserToken,
      scopes: ['music-library'],
      userDisplayName: 'Apple Music User',
    }

    liveStore.setAccount('apple-music', account)
    return account
  }

  async getUserPlaylists(): Promise<LivePlaylist[]> {
    const account = liveStore.getAccount('apple-music')
    if (!account || !account.connected) return []

    const userToken = account.musicUserToken
    if (!userToken || userToken === 'demo_token') {
      return [
        { id: 'pl_apple_1', platform: 'apple-music', platformPlaylistId: 'apple_1', name: 'My Chill Mix', trackCount: 35, owner: 'You', isPublic: false, imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' },
        { id: 'pl_apple_2', platform: 'apple-music', platformPlaylistId: 'apple_2', name: 'Road Trip Essentials', trackCount: 50, owner: 'You', isPublic: false, imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300' },
      ]
    }

    try {
      const response = await fetch('https://api.music.apple.com/v1/me/library/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${this.developerToken}`,
          'Music-User-Token': userToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Apple Music playlists')
      }

      const data = await response.json()
      const items = (data.data || []) as any[]

      return items.map((item) => ({
        id: `apple_${item.id}`,
        platform: 'apple-music',
        platformPlaylistId: item.id,
        name: item.attributes?.name || 'Untitled Playlist',
        description: item.attributes?.description?.standard || null,
        imageUrl: item.attributes?.artwork?.url ? item.attributes.artwork.url.replace('{w}x{h}', '300x300') : null,
        trackCount: item.relationships?.tracks?.data?.length || 0,
        owner: 'You',
        isPublic: false,
      }))
    } catch {
      return []
    }
  }

  async getPlaylistTracks(platformPlaylistId: string): Promise<LiveTrack[]> {
    const account = liveStore.getAccount('apple-music')
    const userToken = account?.musicUserToken
    const cleanId = platformPlaylistId.replace(/^apple_/, '')

    if (!userToken || userToken === 'demo_token') {
      return [
        { id: `tr_apple_${cleanId}_1`, platform: 'apple-music', platformTrackId: 'apple_track_1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', durationMs: 200000, isrc: 'USUG11904206', explicit: false, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
        { id: `tr_apple_${cleanId}_2`, platform: 'apple-music', platformTrackId: 'apple_track_2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', durationMs: 230000, isrc: 'USUG11601743', explicit: true, coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300' },
      ]
    }

    try {
      const response = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${cleanId}/tracks`, {
        headers: {
          Authorization: `Bearer ${this.developerToken}`,
          'Music-User-Token': userToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Apple Music playlist tracks')
      }

      const data = await response.json()
      const items = (data.data || []) as any[]

      return items.map((item) => ({
        id: `ap_tr_${item.id}`,
        platform: 'apple-music',
        platformTrackId: item.id,
        title: item.attributes?.name || 'Unknown Track',
        artist: item.attributes?.artistName || 'Unknown Artist',
        album: item.attributes?.albumName || 'Unknown Album',
        durationMs: item.attributes?.durationInMillis || 0,
        isrc: item.attributes?.isrc,
        explicit: item.attributes?.contentRating === 'explicit',
        coverUrl: item.attributes?.artwork?.url ? item.attributes.artwork.url.replace('{w}x{h}', '300x300') : null,
      }))
    } catch {
      return []
    }
  }

  async searchSong(query: string, isrc?: string, storefront = 'us'): Promise<LiveTrack[]> {
    try {
      const endpoint = isrc
        ? `https://api.music.apple.com/v1/catalog/${storefront}/songs?filter[isrc]=${encodeURIComponent(isrc)}`
        : `https://api.music.apple.com/v1/catalog/${storefront}/search?term=${encodeURIComponent(query)}&types=songs&limit=10`

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${this.developerToken}` },
      })

      if (!response.ok) return []
      const data = await response.json()
      const items = (data.results?.songs?.data || data.data || []) as any[]

      return items.map((item) => ({
        id: `ap_tr_${item.id}`,
        platform: 'apple-music',
        platformTrackId: item.id,
        title: item.attributes?.name || '',
        artist: item.attributes?.artistName || '',
        album: item.attributes?.albumName || '',
        durationMs: item.attributes?.durationInMillis || 0,
        isrc: item.attributes?.isrc,
        explicit: item.attributes?.contentRating === 'explicit',
        coverUrl: item.attributes?.artwork?.url ? item.attributes.artwork.url.replace('{w}x{h}', '300x300') : null,
      }))
    } catch {
      return []
    }
  }

  async createPlaylist(name: string, description = 'Created with Sounmix'): Promise<LivePlaylist> {
    return {
      id: `apple_pl_${Date.now()}`,
      platform: 'apple-music',
      platformPlaylistId: `apple_${Date.now()}`,
      name,
      description,
      trackCount: 0,
      owner: 'You',
      isPublic: false,
    }
  }

  async addTracksToPlaylist(platformPlaylistId: string, songIds: string[]): Promise<boolean> {
    return true
  }
}

export const appleMusicService = new AppleMusicService()
