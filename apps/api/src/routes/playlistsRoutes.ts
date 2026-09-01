import { Router } from 'express'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { type Platform } from '../services/liveStore.js'

export const playlistsRouter = Router({ mergeParams: true })

playlistsRouter.get('/', async (request, response, next) => {
  try {
    const platform = (request.params as Record<string, string>).platform as Platform | undefined

    if (platform === 'spotify') {
      const list = await spotifyService.getUserPlaylists()
      response.json({ success: true, data: list })
      return
    }

    if (platform === 'apple-music') {
      const list = await appleMusicService.getUserPlaylists()
      response.json({ success: true, data: list })
      return
    }

    const [spotifyList, appleList] = await Promise.all([
      spotifyService.getUserPlaylists(),
      appleMusicService.getUserPlaylists(),
    ])

    response.json({ success: true, data: [...spotifyList, ...appleList] })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/playlists', async (request, response, next) => {
  try {
    const platform = request.params.platform as Platform
    const list = platform === 'spotify'
      ? await spotifyService.getUserPlaylists()
      : await appleMusicService.getUserPlaylists()

    response.json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/playlists/:playlistId', async (request, response, next) => {
  try {
    const { platform, playlistId } = request.params
    const list = platform === 'spotify'
      ? await spotifyService.getUserPlaylists()
      : await appleMusicService.getUserPlaylists()

    const playlist = list.find((p) => p.id === playlistId || p.platformPlaylistId === playlistId)

    if (!playlist) {
      response.status(404).json({ success: false, error: { code: 'PLAYLIST_NOT_FOUND', message: 'Playlist could not be found' } })
      return
    }

    response.json({ success: true, data: playlist })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/playlists/:playlistId/tracks', async (request, response, next) => {
  try {
    const { platform, playlistId } = request.params
    const tracks = platform === 'spotify'
      ? await spotifyService.getPlaylistTracks(playlistId)
      : await appleMusicService.getPlaylistTracks(playlistId)

    response.json({ success: true, data: tracks })
  } catch (error) {
    next(error)
  }
})

playlistsRouter.get('/:platform/tracks/:trackId', async (request, response, next) => {
  try {
    const { platform, trackId } = request.params
    const searchResult = platform === 'spotify'
      ? await spotifyService.searchTrack(trackId)
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
