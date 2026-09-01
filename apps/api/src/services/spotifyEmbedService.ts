import { liveStore, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class SpotifyEmbedService {
  /**
   * Extract real playlist metadata and all tracks from Spotify embed Next.js data
   */
  async fetchPlaylistByUrlOrId(urlOrId: string): Promise<{ playlist: LivePlaylist; tracks: LiveTrack[] } | null> {
    const cleanId = this.extractPlaylistId(urlOrId)
    if (!cleanId) return null

    try {
      const embedUrl = `https://open.spotify.com/embed/playlist/${cleanId}`
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!res.ok) {
        return null
      }

      const html = await res.text()
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)
      if (!match) {
        return null
      }

      const nextData = JSON.parse(match[1])
      const entity = nextData.props?.pageProps?.state?.data?.entity

      if (!entity) return null

      const playlistTitle = entity.name || entity.title || 'Spotify Playlist'
      const coverUrl = entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || null
      const rawTracks = (entity.trackList || []) as any[]

      const tracks: LiveTrack[] = rawTracks.map((item, index) => ({
        id: item.uid || `sp_tr_${index}`,
        platform: 'spotify',
        platformTrackId: item.uri?.replace('spotify:track:', '') || item.uid || `tr_${index}`,
        title: item.title || 'Untitled Track',
        artist: item.subtitle || 'Unknown Artist',
        album: playlistTitle,
        durationMs: item.duration || 0,
        isrc: item.isrc || undefined,
        explicit: Boolean(item.isExplicit),
        coverUrl: coverUrl,
        uri: item.uri || `spotify:track:${item.uid}`,
      }))

      const playlist: LivePlaylist = {
        id: `spotify_${cleanId}`,
        platform: 'spotify',
        platformPlaylistId: cleanId,
        name: playlistTitle,
        description: entity.subtitle || entity.description || 'Imported via Spotify Open Sync',
        imageUrl: coverUrl,
        trackCount: tracks.length,
        owner: entity.owner?.name || 'Spotify User',
        isPublic: true,
      }

      return { playlist, tracks }
    } catch (err) {
      console.error('Spotify embed fetch error:', err)
      return null
    }
  }

  /**
   * Search real tracks using open iTunes/Apple & Deezer public music engines (Zero Premium needed)
   */
  async searchOpenTrack(query: string): Promise<LiveTrack[]> {
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`
      const res = await fetch(itunesUrl)
      if (!res.ok) return []

      const data = await res.json()
      const results = (data.results || []) as any[]

      return results.map((item) => ({
        id: `itunes_${item.trackId}`,
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
    } catch {
      return []
    }
  }

  extractPlaylistId(input: string): string {
    const trimmed = input.trim()
    const match = trimmed.match(/playlist\/([a-zA-Z0-9]+)/)
    if (match) return match[1]
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed
    return trimmed
  }
}

export const spotifyEmbedService = new SpotifyEmbedService()
