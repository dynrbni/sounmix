import { liveStore, type LivePlaylist, type LiveTrack } from './liveStore.js'

export class AppleMusicEmbedService {
  /**
   * Fetch real playlist and tracks from any Apple Music URL or playlist ID
   */
  async fetchPlaylistByUrlOrId(urlOrId: string): Promise<{ playlist: LivePlaylist; tracks: LiveTrack[] } | null> {
    const cleanUrl = this.normalizeAppleMusicUrl(urlOrId)

    try {
      const res = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!res.ok) return null
      const html = await res.text()

      const match = html.match(/<script type="application\/json" id="serialized-server-data">([^<]+)<\/script>/)
      if (!match) return null

      const json = JSON.parse(match[1])
      const pageData = json.data?.[0]?.data
      if (!pageData) return null

      // Find tracklist section
      const sections = pageData.sections || []
      const trackSection = sections.find((s: any) => s.items && s.items.length > 0 && s.items[0]?.contentDescriptor?.kind === 'song')
      const items = trackSection?.items || []

      // Extract playlist title and header
      const seoData = pageData.seoData || {}
      const playlistName = seoData.ogTitle || seoData.title || 'Apple Music Playlist'
      const playlistId = json.data?.[0]?.intent?.contentDescriptor?.identifiers?.storeAdamID || `apple_${Date.now()}`

      const tracks: LiveTrack[] = items.map((item: any, idx: number) => {
        const rawArtwork = item.artwork?.dictionary?.url || ''
        const coverUrl = rawArtwork ? rawArtwork.replace('{w}x{h}bb.{f}', '600x600bb.jpg') : null

        return {
          id: `apple_tr_${item.contentDescriptor?.identifiers?.storeAdamID || idx}`,
          platform: 'apple-music',
          platformTrackId: item.contentDescriptor?.identifiers?.storeAdamID || String(idx),
          title: item.title || item.name || 'Untitled Song',
          artist: item.artistName || item.subtitleLinks?.[0]?.title || 'Apple Music Artist',
          album: playlistName,
          durationMs: item.duration || 210000,
          explicit: Boolean(item.showExplicitBadge),
          coverUrl,
          previewUrl: item.playAction?.actionMetrics?.data?.[0]?.fields?.actionUrl || null,
        }
      })

      const playlist: LivePlaylist = {
        id: `apple_${playlistId}`,
        platform: 'apple-music',
        platformPlaylistId: playlistId,
        name: playlistName,
        description: seoData.description || 'Imported from Apple Music',
        imageUrl: tracks[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        trackCount: tracks.length,
        owner: 'Apple Music',
        isPublic: true,
      }

      return { playlist, tracks }
    } catch (err) {
      console.error('Apple Music embed fetch error:', err)
      return null
    }
  }

  normalizeAppleMusicUrl(input: string): string {
    const trimmed = input.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
    // If playlist ID like pl.f4d106fed2bd41149aaacabb233eb5eb
    if (trimmed.startsWith('pl.')) {
      return `https://music.apple.com/us/playlist/playlist/${trimmed}`
    }
    return `https://music.apple.com/us/playlist/playlist/${trimmed}`
  }
}

export const appleMusicEmbedService = new AppleMusicEmbedService()
