import { Request, Response, NextFunction } from 'express'
const keyCache = new Set<string>()
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.header('Idempotency-Key')
  if (key) keyCache.add(key)
  next()
}
