import { type Request, type Response, type NextFunction } from 'express'
import { verifyUserToken, type UserJwtPayload } from '../services/jwtService.js'

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.sounmix_token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null)

  if (!token) {
    next()
    return
  }

  const payload = verifyUserToken(token)
  if (payload) {
    req.user = payload
  }

  next()
}
