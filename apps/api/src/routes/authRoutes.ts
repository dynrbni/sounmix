import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config/env.js'
import { sendOtpEmail } from '../services/emailService.js'
import { createOtpChallenge, verifyOtpChallenge } from '../services/otpService.js'
import { signUserToken, verifyUserToken } from '../services/jwtService.js'
import { type AuthenticatedRequest } from '../middleware/authMiddleware.js'

const emailSchema = z.object({
  email: z.string().email(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

const verifySchema = emailSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().optional(),
})

// In-memory store for registered users
const registeredUsers = new Map<string, { email: string; password?: string; displayName: string }>()

export const authRouter = Router()

authRouter.get('/me', (request: AuthenticatedRequest, response) => {
  const token =
    request.cookies?.sounmix_token ||
    (request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : null)

  const payload = token ? verifyUserToken(token) : request.user

  if (!payload) {
    response.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No active session found',
      },
    })
    return
  }

  response.json({
    success: true,
    data: {
      id: payload.userId,
      email: payload.email,
      displayName: payload.displayName || payload.email.split('@')[0],
      isAuthenticated: true,
    },
  })
})

// Direct login with email and password (NO OTP)
authRouter.post('/login', (request, response, next) => {
  try {
    const { email, password } = loginSchema.parse(request.body)
    const existing = registeredUsers.get(email.toLowerCase())

    if (existing && existing.password && existing.password !== password) {
      response.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect password',
        },
      })
      return
    }

    const displayName = existing?.displayName || email.split('@')[0]
    if (!existing) {
      registeredUsers.set(email.toLowerCase(), { email, password, displayName })
    }

    const token = signUserToken({
      userId: email,
      email,
      displayName,
    })

    // Set 7-day cookie
    response.cookie('sounmix_token', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })

    response.json({
      success: true,
      data: {
        token,
        user: {
          id: email,
          email,
          displayName,
        },
        message: 'Logged in successfully',
      },
    })
  } catch (error) {
    next(error)
  }
})

// Send OTP for Register
authRouter.post('/otp/send', async (request, response, next) => {
  try {
    const { email } = emailSchema.parse(request.body)
    const otp = createOtpChallenge(email, config.otp.expiresMinutes)

    const sendResult = await sendOtpEmail(email, otp)

    response.json({
      success: true,
      data: {
        message: 'OTP sent to email',
        expiresInMinutes: config.otp.expiresMinutes,
        deliveryMode: sendResult.mode,
        previewUrl: sendResult.previewUrl,
        devOtp: sendResult.mode !== 'smtp' ? otp : undefined,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Verify OTP for Register only
authRouter.post('/otp/verify', (request, response, next) => {
  try {
    const { email, otp, password } = verifySchema.parse(request.body)
    const result = verifyOtpChallenge(email, otp)

    if (!result.ok) {
      response.status(400).json({
        success: false,
        error: {
          code: result.code,
          message: 'OTP verification failed',
        },
      })
      return
    }

    const displayName = email.split('@')[0]
    registeredUsers.set(email.toLowerCase(), { email, password, displayName })

    const token = signUserToken({
      userId: email,
      email,
      displayName,
    })

    // Set cookie for 7 days
    response.cookie('sounmix_token', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })

    response.json({
      success: true,
      data: {
        token,
        user: {
          id: email,
          email,
          displayName,
        },
        message: 'Registration completed and verified successfully',
      },
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', (_request, response) => {
  response.clearCookie('sounmix_token', { path: '/' })
  response.json({
    success: true,
    data: { message: 'Logged out successfully' },
  })
})
