import { Router } from 'express'
import { tracks, type Platform } from '../services/demoData.js'

export const tracksRouter = Router({ mergeParams: true })

tracksRouter.get('/search', (request, response) => {
  const query = String(request.query.q || '').toLowerCase()
  const platform = request.query.platform as Platform | undefined

  let result = tracks
  if (platform) {
    result = result.filter((t) => t.platform === platform)
  }
  if (query) {
    result = result.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      t.artist.toLowerCase().includes(query) ||
      t.album.toLowerCase().includes(query)
    )
  }

  response.json({ success: true, data: result })
})

tracksRouter.get('/:platform/tracks', (request, response) => {
  const platform = request.params.platform as Platform
  const platformTracks = tracks.filter((item) => item.platform === platform || (!item.platform && platform === 'spotify'))
  response.json({ success: true, data: platformTracks })
})

tracksRouter.get('/:platform/tracks/:trackId', (request, response) => {
  const { platform, trackId } = request.params
  const track = tracks.find((item) => item.id === trackId || item.platformTrackId === trackId)

  if (!track) {
    response.status(404).json({
      success: false,
      error: { code: 'TRACK_NOT_FOUND', message: `Track ${trackId} not found on ${platform}` },
    })
    return
  }

  response.json({ success: true, data: track })
})
