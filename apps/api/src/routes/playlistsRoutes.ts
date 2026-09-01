import { Router } from 'express'
import { playlistTracks, playlists, tracks, type Platform } from '../services/demoData.js'

export const playlistsRouter = Router({ mergeParams: true })

playlistsRouter.get('/', (request, response) => {
  const platform = request.params.platform as Platform | undefined
  if (platform) {
    response.json({ success: true, data: playlists.filter((playlist) => playlist.platform === platform) })
  } else {
    response.json({ success: true, data: playlists })
  }
})

playlistsRouter.get('/:platform/playlists', (request, response) => {
  const platform = request.params.platform as Platform
  response.json({ success: true, data: playlists.filter((playlist) => playlist.platform === platform) })
})


playlistsRouter.get('/:platform/playlists/:playlistId', (request, response) => {
  const playlist = playlists.find((item) => item.platform === request.params.platform && item.id === request.params.playlistId)

  if (!playlist) {
    response.status(404).json({ success: false, error: { code: 'PLAYLIST_NOT_FOUND', message: 'Playlist could not be found' } })
    return
  }

  response.json({ success: true, data: playlist })
})

playlistsRouter.get('/:platform/playlists/:playlistId/tracks', (request, response) => {
  const playlist = playlists.find((item) => item.platform === request.params.platform && item.id === request.params.playlistId)

  if (!playlist) {
    response.status(404).json({ success: false, error: { code: 'PLAYLIST_NOT_FOUND', message: 'Playlist could not be found' } })
    return
  }

  response.json({ success: true, data: playlistTracks[playlist.id as keyof typeof playlistTracks] ?? [] })
})

playlistsRouter.get('/:platform/tracks/:trackId', (request, response) => {
  const track = tracks.find((item) => item.id === request.params.trackId || item.platformTrackId === request.params.trackId)

  if (!track) {
    response.status(404).json({ success: false, error: { code: 'TRACK_NOT_FOUND', message: 'Track could not be found' } })
    return
  }

  response.json({ success: true, data: track })
})
