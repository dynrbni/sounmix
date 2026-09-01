import { Router } from 'express'
import { z } from 'zod'
import { playlists } from '../services/demoData.js'

const mergeSchema = z.object({
  playlistIds: z.array(z.string()).min(2),
  name: z.string().min(1),
  removeDuplicates: z.boolean().default(true),
})

export const mergeRouter = Router()

mergeRouter.post('/merge', (request, response, next) => {
  try {
    const input = mergeSchema.parse(request.body)
    const selected = playlists.filter((playlist) => input.playlistIds.includes(playlist.id))
    const rawTotal = selected.reduce((total, playlist) => total + playlist.trackCount, 0)
    const duplicateCount = input.removeDuplicates ? 37 : 0

    response.status(201).json({
      success: true,
      data: {
        id: `merged_${Date.now()}`,
        name: input.name,
        rawTotal,
        duplicateCount,
        finalTotal: rawTotal - duplicateCount,
      },
    })
  } catch (error) {
    next(error)
  }
})
