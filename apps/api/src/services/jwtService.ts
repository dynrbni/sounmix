import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export interface UserJwtPayload {
  userId: string
  email: string
  displayName?: string
}

export function signUserToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}


export function verifyUserToken(token: string): UserJwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserJwtPayload
    return decoded
  } catch {
    return null
  }
}
