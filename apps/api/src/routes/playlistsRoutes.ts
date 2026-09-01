import { Router } from 'express'
import { z } from 'zod'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { spotifyEmbedService } from '../services/spotifyEmbedService.js'
import { liveStore, type Platform, type LivePlaylist, type LiveTrack } from '../services/liveStore.js'

import { appleMusicEmbedService } from '../services/appleMusicEmbedService.js'

const importSchema = z.object({
  url: z.string().min(1),
})

export const playlistsRouter = Router({ mergeParams: true })

playlistsRouter.post('/import-apple-music', async (request, response, next) => {
  try {
    const { url } = importSchema.parse(request.body)
    const result = await appleMusicEmbedService.fetchPlaylistByUrlOrId(url)

    if (!result) {
      response.status(400).json({
        success: false,
        error: { code: 'INVALID_APPLE_MUSIC_URL', message: 'Could not fetch Apple Music playlist. Please check the URL or ID.' },
      })
      return
    }

    // Store in liveStore
    liveStore.setPlaylist(result.playlist, result.tracks)

    // Mark Apple Music account as connected
    liveStore.setAccount('apple-music', {
      id: 'acc_apple_open',
      platform: 'apple-music',
      name: 'Apple Music',
      connected: true,
      userDisplayName: result.playlist.name,
    })

    response.json({
      success: true,
      data: {
        playlist: result.playlist,
        trackCount: result.tracks.length,
        message: `Successfully imported Apple Music playlist "${result.playlist.name}" with ${result.tracks.length} real tracks!`,
      },
    })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.post('/import-url', async (request, response, next) => {

  try {
    const { url } = importSchema.parse(request.body)
    const result = await spotifyEmbedService.fetchPlaylistByUrlOrId(url)

    if (!result) {
      response.status(400).json({
        success: false,
        error: { code: 'INVALID_SPOTIFY_URL', message: 'Could not fetch Spotify playlist. Please check the URL or ID.' },
      })
      return
    }

    // Store in liveStore
    liveStore.setPlaylist(result.playlist, result.tracks)

    // Mark Spotify account as connected
    liveStore.setAccount('spotify', {
      id: 'acc_spotify_open',
      platform: 'spotify',
      name: 'Spotify',
      connected: true,
      userDisplayName: result.playlist.owner || 'Spotify User',
    })

    response.json({
      success: true,
      data: {
        playlist: result.playlist,
        trackCount: result.tracks.length,
        message: `Successfully imported "${result.playlist.name}" with ${result.tracks.length} real tracks!`,
      },
    })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/', async (request, response, next) => {
  try {
    const platform = (request.params as Record<string, string>).platform as Platform | undefined
    const storePlaylists = liveStore.getAllPlaylists()

    if (platform === 'spotify') {
      const apiList = await spotifyService.getUserPlaylists()
      const combined = [...storePlaylists.filter((p) => p.platform === 'spotify'), ...apiList]
      const unique = Array.from(new Map(combined.map((p) => [p.platformPlaylistId, p])).values())
      response.json({ success: true, data: unique })
      return
    }

    if (platform === 'apple-music') {
      const list = await appleMusicService.getUserPlaylists()
      const combined = [...storePlaylists.filter((p) => p.platform === 'apple-music'), ...list]
      const unique = Array.from(new Map(combined.map((p) => [p.platformPlaylistId, p])).values())
      response.json({ success: true, data: unique })
      return
    }

    const [spotifyList, appleList] = await Promise.all([
      spotifyService.getUserPlaylists(),
      appleMusicService.getUserPlaylists(),
    ])

    const combined = [...storePlaylists, ...spotifyList, ...appleList]
    const unique = Array.from(new Map(combined.map((p) => [p.id, p])).values())
    response.json({ success: true, data: unique })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/playlists', async (request, response, next) => {
  try {
    const platform = request.params.platform as Platform
    const storePlaylists = liveStore.getAllPlaylists().filter((p) => p.platform === platform)
    const apiList = platform === 'spotify'
      ? await spotifyService.getUserPlaylists()
      : await appleMusicService.getUserPlaylists()

    const combined = [...storePlaylists, ...apiList]
    const unique = Array.from(new Map(combined.map((p) => [p.platformPlaylistId, p])).values())
    response.json({ success: true, data: unique })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/playlists/:playlistId/tracks', async (request, response, next) => {
  try {
    const { platform, playlistId } = request.params
    const cleanId = playlistId.replace(/^spotify_/, '').replace(/^apple_/, '')

    // Check store first
    const storedTracks = liveStore.getPlaylistTracks(`spotify_${cleanId}`) || liveStore.getPlaylistTracks(playlistId)
    if (storedTracks && storedTracks.length > 0) {
      response.json({ success: true, data: storedTracks })
      return
    }

    // Try Spotify Web API
    let tracks: LiveTrack[] = []
    if (platform === 'spotify') {
      try {
        tracks = await spotifyService.getPlaylistTracks(cleanId)
      } catch {
        tracks = []
      }

      // If empty or Web API failed/premium restricted, use Spotify Open Embed Scraper
      if (tracks.length === 0) {
        const embedResult = await spotifyEmbedService.fetchPlaylistByUrlOrId(cleanId)
        if (embedResult) {
          tracks = embedResult.tracks
          liveStore.setPlaylist(embedResult.playlist, embedResult.tracks)
        }
      }
    } else {
      tracks = await appleMusicService.getPlaylistTracks(cleanId)
    }

    response.json({ success: true, data: tracks })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/tracks/:trackId', async (request, response, next) => {
  try {
    const { platform, trackId } = request.params
    const searchResult = platform === 'spotify'
      ? await spotifyEmbedService.searchOpenTrack(trackId)
      : await appleMusicService.searchSong(trackId)

    const track = searchResult[0]
    if (!track) {
      response.status(404).json({ success: false, error: { code: 'TRACK_NOT_FOUND', message: 'Track could not be found' } })
      return
    }

    response.json({ success: true, data: track })
  } catch (error) {
    next(error)
  }
})
