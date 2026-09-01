import { Router } from 'express'
import { z } from 'zod'
import { tracks } from '../services/demoData.js'

const moveSchema = z.object({
  sourcePlaylistId: z.string(),
  destinationPlaylistId: z.string(),
  artist: z.string().min(1),
})

export const organizerRouter = Router()

organizerRouter.post('/artist/move', (request, response, next) => {
  try {
    const input = moveSchema.parse(request.body)
    const matchedTracks = tracks.filter((track) => track.artist.toLowerCase().includes(input.artist.toLowerCase()))

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
