import { Router } from 'express'
import { liveStore } from '../services/liveStore.js'

export const operationsRouter = Router()

operationsRouter.get('/', (_request, response) => {
  response.json({ success: true, data: liveStore.operations })
})

operationsRouter.get('/:id', (request, response) => {
  const operation = liveStore.operations.find((item) => item.id === request.params.id)

  if (!operation) {
    response.status(404).json({ success: false, error: { code: 'OPERATION_NOT_FOUND', message: 'Operation could not be found' } })
    return
  }

  response.json({ success: true, data: operation })
})
