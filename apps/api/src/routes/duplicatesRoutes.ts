import { Router } from 'express'
import { z } from 'zod'
import { tracks } from '../services/demoData.js'

const scanSchema = z.object({
  playlistId: z.string(),
})

const removeSchema = z.object({
  playlistId: z.string(),
  playlistTrackIds: z.array(z.string()).min(1),
})

export const duplicatesRouter = Router()

duplicatesRouter.post('/scan', (request, response, next) => {
  try {
    const input = scanSchema.parse(request.body)
    response.json({
      success: true,
      data: {
        playlistId: input.playlistId,
        duplicateCount: 4,
        groups: [
          { id: 'dup_group_1', reason: 'ISRC_MATCH', tracks: [tracks[0], tracks[0]] },
          { id: 'dup_group_2', reason: 'NORMALIZED_METADATA_MATCH', tracks: [tracks[1], tracks[1]] },
        ],
      },
    })
  } catch (error) {
    next(error)
  }
})

duplicatesRouter.post('/remove', (request, response, next) => {
  try {
    const input = removeSchema.parse(request.body)
    response.json({
      success: true,
      data: {
        playlistId: input.playlistId,
        removedCount: input.playlistTrackIds.length,
        libraryTracksDeleted: false,
      },
    })
  } catch (error) {
    next(error)
  }
})
