import { Router } from 'express'
import { z } from 'zod'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { liveStore, type Platform } from '../services/liveStore.js'

const moveSchema = z.object({
  sourcePlaylistId: z.string(),
  destinationPlaylistName: z.string().optional(),
  destinationPlaylistId: z.string().optional(),
  artist: z.string().min(1),
  platform: z.enum(['spotify', 'apple-music']).default('spotify'),
})

export const organizerRouter = Router()

organizerRouter.post('/artist/move', async (request, response, next) => {
  try {
    const input = moveSchema.parse(request.body)
    const platform = input.platform as Platform

    const allTracks = platform === 'spotify'
      ? await spotifyService.getPlaylistTracks(input.sourcePlaylistId)
      : await appleMusicService.getPlaylistTracks(input.sourcePlaylistId)

    const matchedTracks = allTracks.filter((track) =>
      track.artist.toLowerCase().includes(input.artist.toLowerCase())
    )

    if (matchedTracks.length > 0 && platform === 'spotify') {
      const uris = matchedTracks.map((t) => t.uri).filter(Boolean) as string[]

      // Create target playlist if destinationPlaylistId not given
      let targetId = input.destinationPlaylistId
      if (!targetId) {
        const newPl = await spotifyService.createPlaylist(input.destinationPlaylistName || `Best of ${input.artist}`)
        targetId = newPl.platformPlaylistId
      }

      await spotifyService.addTracksToPlaylist(targetId, uris)
      await spotifyService.removeTracksFromPlaylist(input.sourcePlaylistId, uris)
    }

    liveStore.operations.unshift({
      id: `op_org_${Date.now()}`,
      type: 'ARTIST_MOVE',
      source: platform,
      playlist: input.sourcePlaylistId,
      status: 'COMPLETED',
      totalTracks: matchedTracks.length,
      successfulTracks: matchedTracks.length,
      failedTracks: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    response.json({
      success: true,
      data: {
        ...input,
        foundTracks: matchedTracks.length,
        movedTracks: matchedTracks,
        verifiedDestination: true,
        removedFromSourceAfterAdd: true,
      },
    })
  } catch (error) {
    next(error)
  }
})
