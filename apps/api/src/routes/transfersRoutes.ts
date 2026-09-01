import { Router } from 'express'
import { z } from 'zod'
import { jobs } from '../services/demoData.js'

const transferSchema = z.object({
  sourcePlatform: z.string(),
  destinationPlatform: z.string(),
  sourcePlaylistId: z.string(),
  destinationPlaylistId: z.string().optional(),
})

export const transfersRouter = Router()

transfersRouter.get('/', (_request, response) => {
  const allJobs = Array.from(jobs.values())
  response.json({ success: true, data: allJobs })
})

transfersRouter.post('/', (request, response, next) => {

  try {
    const input = transferSchema.parse(request.body)
    const id = `transfer_${Date.now()}`
    const job = {
      id,
      status: 'PENDING' as const,
      progress: { current: 0, total: 247, percent: 0 },
      result: {
        ...input,
        matched: 239,
        uncertain: 5,
        unavailable: 3,
      },
    }

    jobs.set(id, job)
    response.status(201).json({ success: true, data: job })
  } catch (error) {
    next(error)
  }
})

transfersRouter.get('/:id', (request, response) => {
  const job = jobs.get(request.params.id)

  if (!job) {
    response.status(404).json({ success: false, error: { code: 'TRANSFER_NOT_FOUND', message: 'Transfer job could not be found' } })
    return
  }

  response.json({ success: true, data: job })
})

transfersRouter.post('/:id/cancel', (request, response) => {
  const job = jobs.get(request.params.id)

  if (!job) {
    response.status(404).json({ success: false, error: { code: 'TRANSFER_NOT_FOUND', message: 'Transfer job could not be found' } })
    return
  }

  const cancelled = { ...job, status: 'CANCELLED' as const }
  jobs.set(request.params.id, cancelled)
  response.json({ success: true, data: cancelled })
})
