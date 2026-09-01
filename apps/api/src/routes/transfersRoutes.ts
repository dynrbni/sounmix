import { Router } from 'express'
import { z } from 'zod'
import { liveStore, type Platform } from '../services/liveStore.js'
import { transferEngine } from '../services/transferEngine.js'

const transferSchema = z.object({
  sourcePlatform: z.enum(['spotify', 'apple-music']),
  destinationPlatform: z.enum(['spotify', 'apple-music']),
  sourcePlaylistId: z.string().min(1),
  destinationPlaylistName: z.string().optional(),
})

export const transfersRouter = Router()

transfersRouter.get('/', (_request, response) => {
  const jobsList = Array.from(liveStore.transferJobs.values())
  response.json({ success: true, data: jobsList })
})

transfersRouter.post('/', async (request, response, next) => {
  try {
    const input = transferSchema.parse(request.body)
    const job = await transferEngine.startTransfer(
      input.sourcePlatform as Platform,
      input.destinationPlatform as Platform,
      input.sourcePlaylistId,
      input.destinationPlaylistName
    )

    response.status(201).json({ success: true, data: job })
  } catch (error) {
    next(error)
  }
})

transfersRouter.get('/:id', (request, response) => {
  const job = liveStore.transferJobs.get(request.params.id)

  if (!job) {
    response.status(404).json({ success: false, error: { code: 'TRANSFER_NOT_FOUND', message: 'Transfer job could not be found' } })
    return
  }

  response.json({ success: true, data: job })
})

transfersRouter.post('/:id/cancel', (request, response) => {
  const job = liveStore.transferJobs.get(request.params.id)

  if (!job) {
    response.status(404).json({ success: false, error: { code: 'TRANSFER_NOT_FOUND', message: 'Transfer job could not be found' } })
    return
  }

  job.status = 'CANCELLED'
  liveStore.transferJobs.set(request.params.id, job)
  response.json({ success: true, data: job })
})
