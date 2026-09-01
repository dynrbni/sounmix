import { Router } from 'express'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { type Platform } from '../services/liveStore.js'

export const tracksRouter = Router({ mergeParams: true })

tracksRouter.get('/search', async (request, response, next) => {
  try {
    const query = String(request.query.q || '')
    const platform = request.query.platform as Platform | undefined
    const isrc = request.query.isrc as string | undefined

    if (!query && !isrc) {
      response.json({ success: true, data: [] })
      return
    }

    if (platform === 'spotify') {
      const results = await spotifyService.searchTrack(query, isrc)
      response.json({ success: true, data: results })
      return
    }

    if (platform === 'apple-music') {
      const results = await appleMusicService.searchSong(query, isrc)
      response.json({ success: true, data: results })
      return
    }

    const [spotifyResults, appleResults] = await Promise.all([
      spotifyService.searchTrack(query, isrc),
      appleMusicService.searchSong(query, isrc),
    ])

    response.json({ success: true, data: [...spotifyResults, ...appleResults] })
  } catch (error) {
    next(error)
  }
})

tracksRouter.get('/:platform/tracks', async (request, response, next) => {
  try {
    const platform = request.params.platform as Platform
    const query = String(request.query.q || 'hit')

    const tracks = platform === 'spotify'
      ? await spotifyService.searchTrack(query)
      : await appleMusicService.searchSong(query)

    response.json({ success: true, data: tracks })
  } catch (error) {
    next(error)
  }
})

tracksRouter.get('/:platform/tracks/:trackId', async (request, response, next) => {
  try {
    const { platform, trackId } = request.params
    const tracks = platform === 'spotify'
      ? await spotifyService.searchTrack(trackId)
      : await appleMusicService.searchSong(trackId)

    const track = tracks[0]
    if (!track) {
      response.status(404).json({
        success: false,
        error: { code: 'TRACK_NOT_FOUND', message: `Track ${trackId} not found on ${platform}` },
      })
      return
    }

    response.json({ success: true, data: track })
  } catch (error) {
    next(error)
  }
})
