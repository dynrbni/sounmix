import { Router } from 'express'
import { operations } from '../services/demoData.js'

export const operationsRouter = Router()

operationsRouter.get('/', (_request, response) => {
  response.json({ success: true, data: operations })
})

operationsRouter.get('/:id', (request, response) => {
  const operation = operations.find((item) => item.id === request.params.id)

  if (!operation) {
    response.status(404).json({ success: false, error: { code: 'OPERATION_NOT_FOUND', message: 'Operation could not be found' } })
    return
  }

  response.json({ success: true, data: operation })
})
