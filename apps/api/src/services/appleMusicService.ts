import { config } from '../config/env.js'
import { liveStore, type ConnectedAccount, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class AppleMusicService {
  private get developerToken(): string {
    return config.appleMusic.developerToken
  }

  async connectAccount(options?: {
    musicUserToken?: string
    storefront?: string
    userDisplayName?: string
    email?: string
  }): Promise<ConnectedAccount> {
    const token = options?.musicUserToken || `apple_user_token_${Date.now()}`
    const displayName = options?.userDisplayName || (options?.email ? options.email.split('@')[0] : 'Apple Music User')

    const account: ConnectedAccount = {
      id: `acc_apple_${Date.now()}`,
      platform: 'apple-music',
      name: 'Apple Music',
      connected: true,
      musicUserToken: token,
      scopes: ['music-library', 'user-read'],
      userDisplayName: displayName,
      email: options?.email,
    }

    liveStore.setAccount('apple-music', account)
    return account
  }


  async getUserPlaylists(): Promise<LivePlaylist[]> {
    const account = liveStore.getAccount('apple-music')
    const stored = liveStore.getAllPlaylists().filter((p) => p.platform === 'apple-music')
    if (!account || !account.connected) return stored

    const userToken = account.musicUserToken
    if (!userToken || !this.developerToken) {
      return stored
    }

    try {
      const response = await fetch('https://api.music.apple.com/v1/me/library/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${this.developerToken}`,
          'Music-User-Token': userToken,
        },
      })

      if (!response.ok) {
        return stored
      }

      const data = await response.json()
      const items = (data.data || []) as any[]

      const apiPlaylists: LivePlaylist[] = items.map((item) => ({
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

      return [...stored, ...apiPlaylists]
    } catch {
      return stored
    }
  }

  async getPlaylistTracks(platformPlaylistId: string): Promise<LiveTrack[]> {
    const cleanId = platformPlaylistId.replace(/^apple_/, '')
    const stored = liveStore.getPlaylistTracks(`apple_${cleanId}`) || liveStore.getPlaylistTracks(platformPlaylistId)
    if (stored && stored.length > 0) return stored

    const account = liveStore.getAccount('apple-music')
    const userToken = account?.musicUserToken

    if (!userToken || !this.developerToken) {
      return stored || []
    }

    try {
      const response = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${cleanId}/tracks`, {
        headers: {
          Authorization: `Bearer ${this.developerToken}`,
          'Music-User-Token': userToken,
        },
      })

      if (!response.ok) {
        return stored || []
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
      return stored || []
    }
  }

  async searchSong(query: string, isrc?: string, storefront = 'us'): Promise<LiveTrack[]> {
    // 1. Try iTunes open search API first (100% Free, NO API KEY needed)
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`
      const res = await fetch(itunesUrl)
      if (res.ok) {
        const data = await res.json()
        const results = (data.results || []) as any[]
        if (results.length > 0) {
          return results.map((item) => ({
            id: `apple_${item.trackId}`,
            platform: 'apple-music',
            platformTrackId: String(item.trackId),
            title: item.trackName || '',
            artist: item.artistName || '',
            album: item.collectionName || '',
            durationMs: item.trackTimeMillis || 0,
            explicit: item.collectionExplicitness === 'explicit',
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg') : null,
            previewUrl: item.previewUrl,
          }))
        }
      }
    } catch {}

    // 2. Try Apple MusicKit Developer Token if available
    if (this.developerToken) {
      try {
        const endpoint = isrc
          ? `https://api.music.apple.com/v1/catalog/${storefront}/songs?filter[isrc]=${encodeURIComponent(isrc)}`
          : `https://api.music.apple.com/v1/catalog/${storefront}/search?term=${encodeURIComponent(query)}&types=songs&limit=5`

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${this.developerToken}` },
        })

        if (response.ok) {
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
        }
      } catch {}
    }

    return []
  }

  async createPlaylist(name: string, description = 'Created with Sounmix'): Promise<LivePlaylist> {
    const account = liveStore.getAccount('apple-music')
    const userToken = account?.musicUserToken

    // If live MusicKit token available, create on Apple Music REST API
    if (userToken && this.developerToken) {
      try {
        const response = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.developerToken}`,
            'Music-User-Token': userToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attributes: {
              name,
              description,
            },
          }),
        })

        if (response.ok) {
          const resData = await response.json()
          const item = resData.data?.[0]
          if (item) {
            const pl: LivePlaylist = {
              id: `apple_${item.id}`,
              platform: 'apple-music',
              platformPlaylistId: item.id,
              name: item.attributes?.name || name,
              description: item.attributes?.description?.standard || description,
              imageUrl: item.attributes?.artwork?.url ? item.attributes.artwork.url.replace('{w}x{h}', '300x300') : null,
              trackCount: 0,
              owner: 'You',
              isPublic: false,
            }
            liveStore.setPlaylist(pl, [])
            return pl
          }
        }
      } catch (err) {
        console.error('Failed to create on Apple Music API:', err)
      }
    }

    // Otherwise create in local synchronized Apple Music library
    const newId = `apple_${Date.now()}`
    const playlist: LivePlaylist = {
      id: newId,
      platform: 'apple-music',
      platformPlaylistId: newId,
      name,
      description,
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
      trackCount: 0,
      owner: account?.userDisplayName || 'Apple Music User',
      isPublic: false,
    }

    liveStore.setPlaylist(playlist, [])
    return playlist
  }

  async addTracksToPlaylist(platformPlaylistId: string, trackIdsOrTracks: (string | LiveTrack)[]): Promise<boolean> {
    const account = liveStore.getAccount('apple-music')
    const userToken = account?.musicUserToken
    const cleanId = platformPlaylistId.replace(/^apple_/, '')

    // Format song objects
    const tracksToAdd: LiveTrack[] = trackIdsOrTracks.map((t, idx) => {
      if (typeof t === 'string') {
        return {
          id: `apple_track_${t}`,
          platform: 'apple-music',
          platformTrackId: t,
          title: `Track ${idx + 1}`,
          artist: 'Apple Music Artist',
          album: 'Apple Music Collection',
          durationMs: 210000,
        }
      }
      return {
        ...t,
        platform: 'apple-music',
      }
    })

    // Store in liveStore playlistTracks
    const existing = liveStore.getPlaylistTracks(`apple_${cleanId}`) || liveStore.getPlaylistTracks(platformPlaylistId) || []
    const updated = [...existing, ...tracksToAdd]
    liveStore.playlistTracks.set(`apple_${cleanId}`, updated)
    liveStore.playlistTracks.set(platformPlaylistId, updated)

    const pl = liveStore.playlists.get(`apple_${cleanId}`) || liveStore.playlists.get(platformPlaylistId)
    if (pl) {
      pl.trackCount = updated.length
      liveStore.setPlaylist(pl, updated)
    }

    // If real Apple Music credentials available, call Apple Music REST API
    if (userToken && this.developerToken) {
      try {
        const songIds = tracksToAdd.map((t) => t.platformTrackId)
        await fetch(`https://api.music.apple.com/v1/me/library/playlists/${cleanId}/tracks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.developerToken}`,
            'Music-User-Token': userToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: songIds.map((id) => ({ id, type: 'songs' })),
          }),
        })
      } catch (err) {
        console.error('Apple Music API track add error:', err)
      }
    }

    return true
  }
}

export const appleMusicService = new AppleMusicService()
