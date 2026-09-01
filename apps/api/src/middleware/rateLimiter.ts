import { Request, Response, NextFunction } from 'express'
export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  next()
}
