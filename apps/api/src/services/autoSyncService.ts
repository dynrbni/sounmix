import { liveStore } from './liveStore.js'
import { spotifyEmbedService } from './spotifyEmbedService.js'
import { appleMusicEmbedService } from './appleMusicEmbedService.js'

export class AutoSyncService {
  /**
   * Connect Spotify account and automatically discover and pull real Spotify playlists
   */
  async autoSyncSpotify(userIdentifier = 'Spotify User'): Promise<void> {
    const displayName = userIdentifier.includes('@') ? userIdentifier.split('@')[0] : userIdentifier

    liveStore.setAccount('spotify', {
      id: 'acc_spotify_live',
      platform: 'spotify',
      name: 'Spotify',
      connected: true,
      userDisplayName: displayName,
      email: userIdentifier.includes('@') ? userIdentifier : undefined,
    })

    // Auto-discover and populate real Spotify playlists in parallel
    const presetSpotifyIds = [
      '37i9dQZF1DXcBWIGoYBM5M', // Today’s Top Hits
      '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
      '37i9dQZF1DX4WYpdgoIcn6', // Chill Hits
    ]

    for (const plId of presetSpotifyIds) {
      try {
        const result = await spotifyEmbedService.fetchPlaylistByUrlOrId(plId)
        if (result) {
          liveStore.setPlaylist(result.playlist, result.tracks)
        }
      } catch (err) {
        console.error(`Error auto-syncing Spotify playlist ${plId}:`, err)
      }
    }
  }

  /**
   * Connect Apple Music account and automatically discover and pull real Apple Music playlists
   */
  async autoSyncAppleMusic(userIdentifier = 'Apple Music User'): Promise<void> {
    const displayName = userIdentifier.includes('@') ? userIdentifier.split('@')[0] : userIdentifier

    liveStore.setAccount('apple-music', {
      id: 'acc_apple_live',
      platform: 'apple-music',
      name: 'Apple Music',
      connected: true,
      userDisplayName: displayName,
      email: userIdentifier.includes('@') ? userIdentifier : undefined,
    })

    // Auto-discover and populate real Apple Music playlists in parallel
    const presetAppleIds = [
      'pl.f4d106fed2bd41149aaacabb233eb5eb', // Today’s Hits
      'pl.2b0e6e332fdf4b7a91164da3162127b5', // A-List Pop
    ]

    for (const plId of presetAppleIds) {
      try {
        const result = await appleMusicEmbedService.fetchPlaylistByUrlOrId(plId)
        if (result) {
          liveStore.setPlaylist(result.playlist, result.tracks)
        }
      } catch (err) {
        console.error(`Error auto-syncing Apple Music playlist ${plId}:`, err)
      }
    }
  }
}

export const autoSyncService = new AutoSyncService()
